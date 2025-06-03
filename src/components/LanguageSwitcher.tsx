import { Button } from "@/components/ui/button";
import Image from "next/image";

type Props = {
  currentLanguage: "sv" | "en";
  onLanguageChange: (language: "sv" | "en") => void;
};

const LanguageSwitcher = ({ currentLanguage, onLanguageChange }: Props) => {
  return (
    <div className="fixed top-4 right-4 flex gap-2 z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onLanguageChange("sv")}
        className={`w-10 h-10 ${
          currentLanguage === "sv" ? "opacity-100" : "opacity-50"
        }`}
      >
        <img src="/images/swedish-flag.svg" alt="Swedish" className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onLanguageChange("en")}
        className={`w-10 h-10 ${
          currentLanguage === "en" ? "opacity-100" : "opacity-50"
        }`}
      >
        <img src="/images/english-flag.svg" alt="English" className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
