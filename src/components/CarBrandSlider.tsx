import { useEffect, useState } from "react";

const CAR_BRANDS = [
  "AUDI",
  "BMW",
  "FORD",
  "HYUNDAI",
  "KIA",
  "LEXUS",
  "MERCEDES",
  "PEUGEOT",
  "PORSCHE",
  "RENAULT",
  "SKODA",
  "TESLA",
  "TOYOTA",
  "VOLVO",
  "VW",
] as const;

const CarBrandSlider = () => {
  return (
    <div className="w-full overflow-hidden bg-white py-12">
      <div className="relative w-full">
        <div className="animate-scroll flex space-x-16 whitespace-nowrap">
          {/* Double the logos for seamless infinite scroll */}
          {[...CAR_BRANDS, ...CAR_BRANDS].map((brand, index) => (
            <div
              key={index}
              className="inline-block w-24 flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300"
            >
              <div className="h-16 flex items-center justify-center">
                <img
                  src={`/images/car-brands/${brand.toLowerCase()}.svg`}
                  alt={`${brand} logo`}
                  className="w-full h-auto max-h-12 object-contain"
                  loading={index > CAR_BRANDS.length ? "lazy" : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarBrandSlider;
