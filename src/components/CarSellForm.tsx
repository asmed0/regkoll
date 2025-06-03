import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Camera,
  ChevronLeft,
  CarIcon,
  Check,
  Upload,
  X,
} from "lucide-react";
import CarDamageSelector from "./CarDamageSelector";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translations } from "@/translations";
import { uploadToCloudinary, CLOUD_NAME } from "@/utils/cloudinary";
import { ValuationOverlay } from "./ValuationOverlay";
import CarBrandSlider from "./CarBrandSlider";

type FormStep = 1 | 2 | 3;

const CAR_BRANDS = [
  "TESLA",
  "AUDI",
  "BMW",
  "CUPRA",
  "FORD",
  "HYUNDAI",
  "KIA",
  "LEXUS",
  "MERCEDES",
  "SEAT",
  "SKODA",
  "TOYOTA",
  "VOLVO",
  "VW",
] as const;

type CarBrand = (typeof CAR_BRANDS)[number];

const CAR_MODELS: Record<CarBrand, readonly string[]> = {
  TESLA: ["Model 3", "Model Y", "Model S", "Model X"],
  AUDI: ["A3", "A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
  BMW: ["1 Series", "3 Series", "5 Series", "X1", "X3", "X5", "i4", "iX"],
  CUPRA: ["Born", "Formentor", "Ateca", "Leon"],
  FORD: ["Fiesta", "Focus", "Kuga", "Puma", "Mustang Mach-E"],
  HYUNDAI: ["i10", "i20", "i30", "Kona", "Tucson", "IONIQ 5", "IONIQ 6"],
  KIA: ["Picanto", "Rio", "Ceed", "Niro", "Sportage", "EV6"],
  LEXUS: ["UX", "NX", "RX", "ES", "LS"],
  MERCEDES: ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "EQA", "EQC"],
  SEAT: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  SKODA: ["Fabia", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  TOYOTA: ["Yaris", "Corolla", "Camry", "RAV4", "C-HR", "Aygo", "bZ4X"],
  VOLVO: ["XC40", "XC60", "XC90", "S60", "S90", "C40"],
  VW: ["Polo", "Golf", "Tiguan", "ID.3", "ID.4", "Passat", "T-Roc"],
} as const;

type CarModel<T extends CarBrand> = (typeof CAR_MODELS)[T][number];

type PreviewImage = {
  file: File;
  preview: string;
};

type CarValuation = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  value: number;
  licensePlate: string;
  yearlyTax: number;
  previousOwners: number;
  mpg: number;
  fuel: string;
};

type Props = {
  language: "sv" | "en";
  currentDomain: "gouda" | "taxi";
};

// Add these helper functions at the top of the file, before the component
const displayToInternalValue = (display: number): number => {
  return Math.round(display * 10);
};

const internalToDisplayValue = (internal: number): number => {
  return Math.round(internal / 10);
};

const CarSellForm = ({ language, currentDomain }: Props) => {
  const [step, setStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carDetails, setCarDetails] = useState<CarValuation | null>(null);
  const [formData, setFormData] = useState({
    make: "" as CarBrand | "",
    model: "",
    year: "",
    mileage: "",
    mileageUnit: "mil" as "mil" | "km",
    licensePlate: "",
    hasVAT: null as boolean | null,
    condition: displayToInternalValue(9).toString(),
    damages: [] as Array<{ x: number; y: number; type: "Scratch" | "Bump" }>,
    photos: [] as File[],
    name: "",
    email: "",
    phone: "",
  });
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [licensePlateError, setLicensePlateError] = useState(false);
  const [vatError, setVatError] = useState(false);
  const [yearError, setYearError] = useState(false);
  const [makeError, setMakeError] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [mileageError, setMileageError] = useState(false);
  const [contactMethod, setContactMethod] = useState<"email" | "phone" | null>(
    null
  );
  const [contactMethodError, setContactMethodError] = useState(false);
  const [hasWarnedAboutCondition, setHasWarnedAboutCondition] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);

  const t = translations[language]; // Get current language translations

  // Add this helper function to convert canvas to file
  const canvasToFile = async (canvas: HTMLCanvasElement): Promise<File> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "damages.png", { type: "image/png" });
          resolve(file);
        }
      }, "image/png");
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      if (!validateStep(step)) {
        return;
      }

      if (
        step === 2 &&
        Number(formData.condition) === displayToInternalValue(9) &&
        !hasWarnedAboutCondition
      ) {
        toast.warning(
          language === "sv"
            ? "Är du säker på att bilen är i toppskick (9/10)? Justera skicket om det behövs, eller tryck fortsätt igen om det stämmer."
            : "Are you sure your car is in excellent condition (9/10)? Adjust if needed, or press continue again if correct.",
          {
            duration: 4000,
            dismissible: true,
          }
        );
        setHasWarnedAboutCondition(true);
        return;
      }

      setStep((prev) => (prev + 1) as FormStep);
      return;
    }

    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Cloudinary first
      const uploadPromises = formData.photos.map((photo) =>
        uploadToCloudinary(photo, formData.licensePlate)
      );
      const imageUrls = await Promise.all(uploadPromises);

      // Upload damage diagram if exists
      let damageUrl: string | undefined;
      if (formData.damages.length > 0) {
        try {
          const finalCanvas = document.createElement("canvas");
          const ctx = finalCanvas.getContext("2d");
          if (ctx) {
            finalCanvas.width = 800;
            finalCanvas.height = 400;

            const img = new Image();
            img.src = "/images/car-diagram.png";

            await new Promise((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0, finalCanvas.width, finalCanvas.height);
                formData.damages.forEach((damage) => {
                  const x = (damage.x * finalCanvas.width) / 100;
                  const y = (damage.y * finalCanvas.height) / 100;

                  ctx.beginPath();
                  if (damage.type === "Scratch") {
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 3;
                    ctx.moveTo(x - 10, y - 10);
                    ctx.lineTo(x + 10, y + 10);
                    ctx.moveTo(x + 10, y - 10);
                    ctx.lineTo(x - 10, y + 10);
                  } else {
                    ctx.fillStyle = "yellow";
                    ctx.arc(x, y, 8, 0, Math.PI * 2);
                    ctx.fill();
                  }
                  ctx.stroke();
                });
                resolve(true);
              };
            });

            const blob = await new Promise<Blob>((resolve) =>
              finalCanvas.toBlob((b) => resolve(b!), "image/png", 1.0)
            );

            const damageFile = new File([blob], "damages.png", {
              type: "image/png",
            });
            damageUrl = await uploadToCloudinary(
              damageFile,
              formData.licensePlate
            );
          }
        } catch (error) {
          console.error("Error creating damage diagram:", error);
        }
      }

      // Create webhook payload
      const payload = {
        username: "Car Sales Bot",
        avatar_url: "https://i.imgur.com/4M34hi2.png",
        content: "🚗 **New Car Submission**",
        embeds: [
          {
            type: "rich",
            title: "",
            color: 0x55b7ff,
            fields: [
              {
                name: "🚘 Car Details",
                value: [
                  `**Make:** ${formData.make} ┃ **Model:** ${formData.model}`,
                  `**Year:** ${formData.year} ┃ **Mileage:** ${formData.mileage} ${formData.mileageUnit}`,
                  `**License Plate:** ${formData.licensePlate} ┃ **VAT:** ${
                    formData.hasVAT ? "✅ Yes" : "❌ No"
                  }`,
                  `**Condition Rating:** ${internalToDisplayValue(
                    Number(formData.condition) || displayToInternalValue(5)
                  )}/10`,
                  estimatedValue
                    ? `**Estimated Value:** ${estimatedValue.toLocaleString()} kr`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n"),
                inline: false,
              },
              {
                name: "📊 Car Valuation Details",
                value: carDetails
                  ? [
                      `**Yearly Tax:** ${carDetails.yearlyTax?.toLocaleString()} kr`,
                      `**Previous Owners:** ${carDetails.previousOwners}`,
                      `**Fuel Consumption:** ${carDetails.mpg} l/100km`,
                      `**Fuel Type:** ${carDetails.fuel}`,
                    ].join("\n")
                  : "No valuation details available",
                inline: false,
              },
              {
                name: "🔍 Damage Report",
                value:
                  formData.damages.length > 0
                    ? `*Damage diagram shown in thumbnail*\n${analyzeDamages(
                        formData.damages
                      )}`
                    : "No damages reported",
                inline: false,
              },
              {
                name: "📸 Photos",
                value:
                  formData.photos.length > 0
                    ? imageUrls
                        .map((url, i) => `[Photo ${i + 1}](${url})`)
                        .join("\n")
                    : "No photos uploaded",
                inline: false,
              },
              {
                name: "📞 Contact Information",
                value: [
                  `**Name:** ${formData.name}`,
                  contactMethod === "email"
                    ? `**Email:** ${formData.email}`
                    : `**Phone:** ${formData.phone}`,
                  `**Preferred Contact Method:** ${
                    contactMethod === "email" ? "Email" : "Phone"
                  }`,
                ].join("\n"),
                inline: false,
              },
              {
                name: "🌐 Language",
                value: language === "sv" ? "Swedish" : "English",
                inline: false,
              },
            ],
            thumbnail: damageUrl ? { url: damageUrl } : undefined,
            image: imageUrls.length > 0 ? { url: imageUrls[0] } : undefined,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Send webhook
      const response = await fetch(
        "https://discord.com/api/webhooks/1341542186495246477/WhideOb0W4rbZwtRoDeyknIUmoaRPLzAzZIvMMX3tJvsJZMwWD6lRiQu9IGMlJOec9bs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Show success message and reset form
      toast.success(t.successMessage);

      // Reset form
      setFormData({
        make: "" as CarBrand | "",
        model: "",
        year: "",
        mileage: "",
        mileageUnit: "mil",
        licensePlate: "",
        hasVAT: null,
        condition: displayToInternalValue(9).toString(),
        damages: [],
        photos: [],
        name: "",
        email: "",
        phone: "",
      });
      previewImages.forEach((image) => URL.revokeObjectURL(image.preview));
      setPreviewImages([]);
      setStep(1);
      setHasWarnedAboutCondition(false);
    } catch (error) {
      toast.error(t.submitError);
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as FormStep);
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numbersOnly = value.replace(/\D/g, "");

    if (name === "year") {
      const yearValue = numbersOnly.slice(0, 4);
      setFormData((prev) => ({
        ...prev,
        year: yearValue,
      }));
      setYearError(yearValue.length === 4 && !validateYear(yearValue));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: numbersOnly,
      }));
    }
  };

  const MAX_FILES = 10;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    if (formData.photos.length + files.length > MAX_FILES) {
      toast.error(
        language === "sv"
          ? `Du kan bara ladda upp ${MAX_FILES} bilder`
          : `You can only upload ${MAX_FILES} images`
      );
      e.target.value = "";
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviewImages((prev) => [...prev, ...newImages]);
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));

    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index].preview);
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateLicensePlate = (plate: string) => {
    // Convert to uppercase and remove spaces
    const formatted = plate.toUpperCase().replace(/\s/g, "");

    // Swedish format: ABC123 or ABC12D
    const regex = /^[A-Z]{3}(?:\d{3}|\d{2}[A-Z])$/;
    return regex.test(formatted);
  };

  const handleLicensePlateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Only reset valuation and form data if the plate actually changed
    if (value !== formData.licensePlate) {
      setShowValuation(false);
      setEstimatedValue(null);
      setCarDetails(null);
      // Reset form data to default values, but don't set mileage
      setFormData((prev) => ({
        ...prev,
        licensePlate: value,
        make: "",
        model: "",
        year: "",
        hasVAT: null,
      }));
      // Reset error states
      setMakeError(false);
      setModelError(false);
      setYearError(false);
      setMileageError(false);
      setVatError(false);
    } else {
      // Just update the license plate if it hasn't changed
      setFormData((prev) => ({ ...prev, licensePlate: value }));
    }

    // Update error state
    setLicensePlateError(value.length === 6 && !validateLicensePlate(value));

    // If we have a valid plate, fetch the valuation immediately
    if (value.length === 6 && validateLicensePlate(value)) {
      fetchCarValue(value)
        .then((details) => {
          if (details) {
            setCarDetails(details);
            setFormData((prev) => ({
              ...prev,
              make: (details.make as CarBrand) || prev.make,
              model: details.model || prev.model,
              year: details.year || prev.year,
            }));
            setShowValuation(true);
          }
        })
        .catch((error) => {
          console.error("Error fetching car value:", error);
          setShowValuation(false);
        });
    }
  };

  const validateYear = (year: string) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    return year.length === 4 && yearNum >= 1900 && yearNum <= currentYear;
  };

  // Modify validation function to only require VAT when valuation overlay is shown
  const validateStep = (stepToValidate: number) => {
    if (stepToValidate === 1) {
      // When valuation overlay is shown, only VAT is required
      if (showValuation) {
        const vatValid = formData.hasVAT !== null;
        if (!vatValid) setVatError(true);
        return vatValid;
      }

      // Normal validation when valuation overlay is not shown
      const yearValid = formData.year ? validateYear(formData.year) : false;
      const plateValid = formData.licensePlate
        ? validateLicensePlate(formData.licensePlate)
        : false;
      const makeValid = !!formData.make;
      const modelValid = !!formData.model;
      const mileageValid = !!formData.mileage;
      const vatValid = formData.hasVAT !== null;

      if (!makeValid) setMakeError(true);
      if (!modelValid) setModelError(true);
      if (!yearValid) setYearError(true);
      if (!plateValid) setLicensePlateError(true);
      if (!vatValid) setVatError(true);
      if (!mileageValid) setMileageError(true);

      return (
        yearValid &&
        plateValid &&
        makeValid &&
        modelValid &&
        mileageValid &&
        vatValid
      );
    } else if (stepToValidate === 3) {
      const nameValid = !!formData.name;
      const contactMethodValid = !!contactMethod;
      const contactValid =
        contactMethod === "email" ? !!formData.email : !!formData.phone;

      if (!contactMethodValid) {
        setContactMethodError(true);
      }

      return nameValid && contactMethodValid && contactValid;
    }
    return true;
  };

  // Add step change handler
  const handleStepChange = (newStep: FormStep) => {
    // Can't skip steps forward
    if (newStep > step) {
      for (let i = step; i < newStep; i++) {
        if (!validateStep(i)) {
          return;
        }
      }
    }
    setStep(newStep);
  };

  // Add this helper function
  const analyzeDamages = (
    damages: Array<{ x: number; y: number; type: "Scratch" | "Bump" }>
  ) => {
    const zones = {
      front: { min: 0, max: 25 },
      frontSide: { min: 25, max: 40 },
      middle: { min: 40, max: 60 },
      rearSide: { min: 60, max: 75 },
      rear: { min: 75, max: 100 },
    };

    const damageCount = {
      scratches: 0,
      bumps: 0,
      locations: new Set<string>(),
    };

    damages.forEach((damage) => {
      // Count damage types
      if (damage.type === "Scratch") damageCount.scratches++;
      if (damage.type === "Bump") damageCount.bumps++;

      // Determine location
      let location = "";
      if (damage.x <= zones.front.max) location = "front";
      else if (damage.x <= zones.frontSide.max) location = "front side";
      else if (damage.x <= zones.middle.max) location = "middle";
      else if (damage.x <= zones.rearSide.max) location = "rear side";
      else location = "rear";

      if (damage.y < 50) location += " upper";
      else location += " lower";

      damageCount.locations.add(location);
    });

    // Create summary
    const summary = [];
    if (damageCount.scratches > 0) {
      summary.push(
        `${damageCount.scratches} scratch${
          damageCount.scratches > 1 ? "es" : ""
        }`
      );
    }
    if (damageCount.bumps > 0) {
      summary.push(
        `${damageCount.bumps} bump${damageCount.bumps > 1 ? "s" : ""}`
      );
    }

    const locations = Array.from(damageCount.locations).join(", ");

    return `Found ${summary.join(" and ")} in the ${locations} area${
      damageCount.locations.size > 1 ? "s" : ""
    }.`;
  };

  const fetchCarValue = async (licensePlate: string): Promise<CarValuation> => {
    const response = await fetch(`/api/car-value/${licensePlate}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch car value");
    }

    return data;
  };

  const handleValuationReceived = (value: number) => {
    setEstimatedValue(value);
  };

  const hasCompleteValuation =
    carDetails &&
    carDetails.make &&
    carDetails.model &&
    carDetails.year &&
    carDetails.mileage &&
    carDetails.yearlyTax &&
    carDetails.previousOwners &&
    carDetails.mpg &&
    carDetails.fuel;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            {/* License Plate Section */}
            <div className="space-y-2 max-w-[280px] mx-auto">
              <Label htmlFor="licensePlate" className="text-center block">
                {t.licensePlate}
              </Label>
              <div className="relative h-14 flex items-stretch shadow-sm">
                {/* EU Flag and Country Code */}
                <div className="flex flex-col items-center justify-center bg-[#003399] text-white w-12 rounded-l-sm border-2 border-r-0 border-[#1B254B]">
                  <div className="w-full h-7 flex items-center justify-center">
                    <div className="w-8 h-5 bg-[url('/images/eu-stars.svg')] bg-contain bg-no-repeat bg-center" />
                  </div>
                  <div className="text-[11px] font-bold leading-none tracking-wide mb-1">
                    S
                  </div>
                </div>
                {/* License Plate Input */}
                <Input
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleLicensePlateInput}
                  className="flex-1 h-full rounded-l-none rounded-r-sm uppercase text-2xl font-bold tracking-[0.25em] text-center bg-white border-2 border-[#1B254B] focus-visible:ring-[#1B254B] px-0 placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-[0.15em]"
                  maxLength={6}
                  placeholder="ABC 123"
                  required
                  style={{
                    fontFamily: "'License Plate', system-ui, sans-serif",
                  }}
                />
              </div>
              {licensePlateError && (
                <p className="text-sm text-red-500 mt-1 text-center">
                  {t.invalidLicensePlate}
                </p>
              )}
            </div>

            {showValuation && (
              <div className="max-w-[600px] mx-auto">
                <ValuationOverlay
                  licensePlate={formData.licensePlate}
                  onValuationReceived={handleValuationReceived}
                  currentMileage={formData.mileage}
                />
              </div>
            )}

            {/* Car Details Section - Show when data is missing */}
            {(carDetails?.make === undefined ||
              carDetails?.model === undefined ||
              carDetails?.year === undefined) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!carDetails?.make && (
                  <div className="space-y-2">
                    <Label htmlFor="make">{t.make}</Label>
                    <Select
                      value={formData.make}
                      onValueChange={(value: CarBrand) => {
                        if (CAR_BRANDS.includes(value)) {
                          setFormData((prev) => ({
                            ...prev,
                            make: value,
                            model: "",
                          }));
                          setMakeError(false);
                          setModelError(false);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="make"
                        className={`h-12 ${
                          makeError ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder={t.selectMake} />
                      </SelectTrigger>
                      <SelectContent>
                        {CAR_BRANDS.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {makeError && (
                      <p className="text-sm text-red-500 mt-1">
                        {language === "sv"
                          ? "Vänligen välj ett bilmärke"
                          : "Please select a car brand"}
                      </p>
                    )}
                  </div>
                )}
                {!carDetails?.model && (
                  <div className="space-y-2">
                    <Label htmlFor="model">{t.model}</Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, model: value }));
                        setModelError(false);
                      }}
                      disabled={!formData.make}
                    >
                      <SelectTrigger
                        id="model"
                        className={`h-12 ${
                          modelError ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder={t.selectModel} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.make &&
                          CAR_MODELS[formData.make] &&
                          CAR_MODELS[formData.make].map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {modelError && (
                      <p className="text-sm text-red-500 mt-1">
                        {language === "sv"
                          ? "Vänligen välj en bilmodell"
                          : "Please select a car model"}
                      </p>
                    )}
                  </div>
                )}
                {!carDetails?.year && (
                  <div className="space-y-2">
                    <Label htmlFor="year">{t.year}</Label>
                    <Input
                      id="year"
                      name="year"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}"
                      minLength={4}
                      maxLength={4}
                      placeholder={t.yearPlaceholder}
                      value={formData.year}
                      onChange={handleNumberInput}
                      className={`h-12 ${
                        yearError
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      required
                    />
                    {yearError && (
                      <p className="text-sm text-red-500 mt-1">
                        {language === "sv"
                          ? "Ogiltigt årtal. Ange ett år mellan 1900 och nuvarande år"
                          : "Invalid year. Enter a year between 1900 and current year"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileage">{t.mileage}</Label>
                <div className="relative flex h-12">
                  <Input
                    id="mileage"
                    name="mileage"
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder={t.mileagePlaceholder}
                    value={formData.mileage}
                    onChange={(e) => {
                      handleNumberInput(e);
                      setMileageError(false);
                    }}
                    className={`h-12 pr-[120px] ${
                      mileageError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    required
                  />
                  <div className="absolute right-[1px] inset-y-[1px] flex rounded-r-md overflow-hidden border-l">
                    <Button
                      type="button"
                      variant="ghost"
                      className={`h-full px-3 rounded-none ${
                        formData.mileageUnit === "mil"
                          ? "bg-[#55B7FF] text-white hover:bg-[#55B7FF]/90 hover:text-white"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, mileageUnit: "mil" }))
                      }
                    >
                      mil
                    </Button>
                    <div className="w-px bg-input" />
                    <Button
                      type="button"
                      variant="ghost"
                      className={`h-full px-3 rounded-none ${
                        formData.mileageUnit === "km"
                          ? "bg-[#55B7FF] text-white hover:bg-[#55B7FF]/90 hover:text-white"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, mileageUnit: "km" }))
                      }
                    >
                      km
                    </Button>
                  </div>
                </div>
                {mileageError && (
                  <p className="text-sm text-red-500 mt-1">
                    {language === "sv"
                      ? "Vänligen ange miltal"
                      : "Please enter mileage"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.hasVAT}</Label>
                <div className="flex gap-4 h-12 items-center">
                  <Button
                    type="button"
                    variant={formData.hasVAT === true ? "default" : "outline"}
                    className={`flex-1 ${vatError ? "border-red-500" : ""} ${
                      formData.hasVAT === true
                        ? "bg-[#55B7FF] hover:bg-[#55B7FF]/90 border-[#55B7FF]"
                        : "bg-white border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
                    }`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, hasVAT: true }));
                      setVatError(false);
                    }}
                  >
                    {t.yes}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.hasVAT === false ? "default" : "outline"}
                    className={`flex-1 ${vatError ? "border-red-500" : ""} ${
                      formData.hasVAT === false
                        ? "bg-[#55B7FF] hover:bg-[#55B7FF]/90 border-[#55B7FF]"
                        : "bg-white border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
                    }`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, hasVAT: false }));
                      setVatError(false);
                    }}
                  >
                    {t.no}
                  </Button>
                </div>
                {vatError && (
                  <p className="text-sm text-red-500 mt-1">
                    {language === "sv"
                      ? "Vänligen välj ett alternativ"
                      : "Please select an option"}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condition">{t.condition}</Label>
                <div className="space-y-4">
                  <Slider
                    id="condition"
                    name="condition"
                    value={[
                      Number(formData.condition) || displayToInternalValue(5),
                    ]}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        condition: value[0].toString(),
                      }))
                    }
                    max={100}
                    min={1}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 ({t.poor})</span>
                    <span className="font-medium text-[#55B7FF]">
                      {internalToDisplayValue(
                        Number(formData.condition) || displayToInternalValue(5)
                      )}
                      /10
                    </span>
                    <span>10 ({t.perfect})</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    1 = {t.conditionDesc1}
                    <br />5 = {t.conditionDesc5}
                    <br />
                    10 = {t.conditionDesc10}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.markDamage}</Label>
              <CarDamageSelector
                onDamageUpdate={(damages) =>
                  setFormData((prev) => ({ ...prev, damages }))
                }
                language={language}
              />
            </div>

            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple={true}
                onChange={handleFileSelect}
              />

              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {t.uploadPhotos}
                  {formData.photos.length > 0 && (
                    <span className="block mt-1 text-xs text-gray-400">
                      {language === "sv"
                        ? `${formData.photos.length}/${MAX_FILES} bilder uppladdade`
                        : `${formData.photos.length}/${MAX_FILES} images uploaded`}
                    </span>
                  )}
                </p>
              </div>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">{t.contactInfo}</h3>

            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t.namePlaceholder}
                value={formData.name}
                onChange={handleChange}
                className="h-12"
                required
              />
              {nameError && (
                <p className="text-sm text-red-500 mt-1">
                  {language === "sv"
                    ? "Vänligen ange ditt namn"
                    : "Please enter your name"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t.preferredContact}</Label>
              <div className="flex gap-4 h-12 items-center">
                <Button
                  type="button"
                  variant={contactMethod === "email" ? "default" : "outline"}
                  className={`flex-1 ${
                    contactMethodError ? "border-red-500" : ""
                  } ${
                    contactMethod === "email"
                      ? "bg-[#55B7FF] hover:bg-[#55B7FF]/90 border-[#55B7FF]"
                      : "bg-white border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
                  }`}
                  onClick={() => {
                    setContactMethod("email");
                    setContactMethodError(false);
                  }}
                >
                  {t.byEmail}
                </Button>
                <Button
                  type="button"
                  variant={contactMethod === "phone" ? "default" : "outline"}
                  className={`flex-1 ${
                    contactMethodError ? "border-red-500" : ""
                  } ${
                    contactMethod === "phone"
                      ? "bg-[#55B7FF] hover:bg-[#55B7FF]/90 border-[#55B7FF]"
                      : "bg-white border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
                  }`}
                  onClick={() => {
                    setContactMethod("phone");
                    setContactMethodError(false);
                  }}
                >
                  {t.byPhone}
                </Button>
              </div>
              {contactMethodError && (
                <p className="text-sm text-red-500 mt-1">
                  {language === "sv"
                    ? "Vänligen välj hur du vill bli kontaktad"
                    : "Please select how you would like to be contacted"}
                </p>
              )}
            </div>

            {contactMethod === "email" && (
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12"
                  required
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">
                    {language === "sv"
                      ? "Vänligen ange din e-postadress"
                      : "Please enter your email"}
                  </p>
                )}
              </div>
            )}

            {contactMethod === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-12"
                  required
                />
                {phoneError && (
                  <p className="text-sm text-red-500 mt-1">
                    {language === "sv"
                      ? "Vänligen ange ditt telefonnummer"
                      : "Please enter your phone number"}
                  </p>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-semibold mb-4">
            {language === "sv" ? "Sälj din bil enkelt" : "Sell your car easily"}
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            {language === "sv"
              ? "Fyll i information om din bil så återkommer vi med ett konkurrenskraftigt erbjudande inom kort."
              : "Fill in information about your car and we'll get back to you with a competitive offer shortly."}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  className={`w-8 h-8 p-0 rounded-full border ${
                    s === step
                      ? "bg-[#55B7FF] text-white hover:bg-[#55B7FF]/90 border-[#55B7FF]"
                      : s < step
                      ? "bg-[#55B7FF]/10 text-[#55B7FF] hover:bg-[#55B7FF]/20 border-[#55B7FF]"
                      : "bg-white text-gray-400 hover:bg-[#55B7FF]/10 hover:text-[#55B7FF] hover:border-[#55B7FF] border-gray-200"
                  }`}
                  onClick={() => handleStepChange(s as FormStep)}
                >
                  {s}
                </Button>
                {s < 3 && (
                  <div
                    className={`w-12 h-1 ml-4 ${
                      s < step ? "bg-[#55B7FF]/20" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}

        <div className="flex gap-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="h-12 text-base font-medium flex-1 border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={`h-12 text-base font-medium bg-[#55B7FF] hover:bg-[#55B7FF]/90 transition-colors ${
              step === 1 ? "w-full" : "flex-1"
            }`}
          >
            {isSubmitting ? t.submitting : step === 3 ? t.submit : t.continue}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Brand Slider Section */}
      <div className="mt-20 -mx-6 border-t border-gray-100">
        <div className="pt-16 pb-8">
          <h3 className="text-2xl font-semibold text-center mb-4">
            {language === "sv"
              ? "Vi köper alla populära bilmärken"
              : "We buy all popular car brands"}
          </h3>
          <p className="text-center text-gray-600 mb-10">
            {language === "sv"
              ? "Oavsett märke eller modell - Vi ger dig ett konkurrenskraftigt erbjudande"
              : "Regardless of make or model - We'll give you a competitive offer"}
          </p>
        </div>
        <CarBrandSlider />
      </div>
    </div>
  );
};

export default CarSellForm;
