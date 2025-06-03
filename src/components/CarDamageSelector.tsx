import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { translations } from "@/translations/index";

type DamageType = "Scratch" | "Bump";

interface DamageMarker {
  x: number;
  y: number;
  type: DamageType;
  side: "Left" | "Right" | "Front" | "Back";
}

interface CarDamageSelectorProps {
  onDamageUpdate: (damages: DamageMarker[]) => void;
  language: "sv" | "en";
}

const CarDamageSelector = ({
  onDamageUpdate,
  language,
}: CarDamageSelectorProps) => {
  const t = translations[language];
  const [damages, setDamages] = useState<DamageMarker[]>([]);
  const [tempClick, setTempClick] = useState<{
    x: number;
    y: number;
    side: "Left" | "Right" | "Front" | "Back";
  } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tempClick) return; // Don't allow new clicks while selecting

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let side: "Left" | "Right" | "Front" | "Back" = "Left";
    if (x < 25) side = "Left";
    else if (x > 75) side = "Right";
    else if (y < 50) side = "Front";
    else side = "Back";

    setTempClick({ x, y, side });
    setPopoverOpen(true);
  };

  const handleDamageTypeSelect = (type: DamageType) => {
    if (tempClick) {
      const newDamage = { ...tempClick, type };
      const updatedDamages = [...damages, newDamage];
      setDamages(updatedDamages);
      onDamageUpdate(updatedDamages);
      setTempClick(null);
      setPopoverOpen(false);
    }
  };

  const handleDelete = (index: number) => {
    const updatedDamages = damages.filter((_, i) => i !== index);
    setDamages(updatedDamages);
    onDamageUpdate(updatedDamages);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (!open) {
      // Clear temporary click if popover is closed without selection
      setTempClick(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match display size
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    // Draw the base car image
    const img = new Image();
    img.src = "/images/car-diagram.png";

    img.onload = () => {
      // First clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the car diagram to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        (canvas.height / img.height) * 0.8 // Slightly smaller to leave room for markers
      );

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Draw existing damage markers on top
      damages.forEach((damage) => {
        const markerX = (damage.x * canvas.width) / 100;
        const markerY = (damage.y * canvas.height) / 100;

        ctx.beginPath();
        if (damage.type === "Scratch") {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 3;
          ctx.moveTo(markerX - 10, markerY - 10);
          ctx.lineTo(markerX + 10, markerY + 10);
          ctx.moveTo(markerX + 10, markerY - 10);
          ctx.lineTo(markerX - 10, markerY + 10);
        } else {
          ctx.fillStyle = "yellow";
          ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.stroke();
      });
    };
  }, [damages]);

  return (
    <div className="space-y-4">
      <div
        className="relative w-full max-w-lg mx-auto aspect-[4/3] border-2 border-gray-200 rounded-lg cursor-crosshair bg-white"
        onClick={handleClick}
      >
        <canvas
          ref={canvasRef}
          id="damage-selector-canvas"
          className="w-full h-full"
          style={{ display: "block" }}
        />
        {damages.map((damage, index) => (
          <div
            key={index}
            className={`absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 group cursor-pointer ${
              damage.type === "Scratch" ? "bg-red-500" : "bg-yellow-500"
            } rounded-full`}
            style={{ left: `${damage.x}%`, top: `${damage.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(index);
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {damage.type === "Scratch" ? "×" : "O"}
              </span>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {damage.type} (Click to remove)
              </span>
            </div>
          </div>
        ))}
        {tempClick && (
          <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
            <PopoverTrigger asChild>
              <div
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400 flex items-center justify-center"
                style={{ left: `${tempClick.x}%`, top: `${tempClick.y}%` }}
              >
                <span className="text-white">+</span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDamageTypeSelect("Scratch")}
                  size="sm"
                >
                  Scratch
                </Button>
                <Button
                  onClick={() => handleDamageTypeSelect("Bump")}
                  size="sm"
                >
                  Bump
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <p className="text-sm text-center text-muted-foreground">
        {t.markDamagePoints}
      </p>
    </div>
  );
};

export default CarDamageSelector;
