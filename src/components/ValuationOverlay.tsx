import { useState, useEffect, useRef } from "react";
import {
  Coins,
  Calendar,
  Car,
  Gauge,
  Users,
  Droplet,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CarDetails {
  value: number | null;
  make: string | null;
  model: string | null;
  yearlyTax: number | null;
  previousOwners: number | null;
  mpg: number | null;
  year: string | null;
  mileage: string | null;
  fuel: string | null;
}

interface ValuationOverlayProps {
  licensePlate: string;
  onValuationReceived?: (value: number) => void;
  currentMileage?: string;
}

const LoadingSkeleton = () => (
  <div className="h-6 bg-gray-200 rounded animate-pulse" />
);

export const ValuationOverlay = ({
  licensePlate,
  onValuationReceived,
  currentMileage,
}: ValuationOverlayProps) => {
  const [carDetails, setCarDetails] = useState<CarDetails | null>(null);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number>();
  const lastFetchedMileage = useRef<string | undefined>(undefined);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Animate counting effect
  useEffect(() => {
    if (!carDetails?.value) return;

    const startValue = Math.max(carDetails.value * 0.5, 50000);
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = Math.floor(
        startValue + (carDetails.value - startValue) * progress
      );
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [carDetails?.value]);

  useEffect(() => {
    if (!licensePlate || licensePlate.length < 6) {
      setCarDetails(null);
      setDisplayValue(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Skip if mileage hasn't changed
    if (currentMileage === lastFetchedMileage.current) {
      return;
    }

    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set loading state immediately
    setIsLoading(true);

    // Set a new timer
    debounceTimer.current = setTimeout(async () => {
      lastFetchedMileage.current = currentMileage;

      try {
        const url = currentMileage
          ? `/api/car-value/${licensePlate}?mileage=${currentMileage}`
          : `/api/car-value/${licensePlate}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.error) {
          const adjustedValue = Math.round(data.value * 0.9);
          data.value = adjustedValue;
          setCarDetails(data);
          if (adjustedValue) {
            onValuationReceived?.(adjustedValue);
          }
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch valuation");
      } finally {
        setIsLoading(false);
      }
    }, 350); // 350ms delay

    // Cleanup function to clear the timer if the component unmounts
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [licensePlate, currentMileage, onValuationReceived]);

  if (!licensePlate || licensePlate.length < 6) {
    return null;
  }

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-1 p-6 bg-[#F8F9FC] rounded-lg border border-gray-100"
    >
      <div className="text-center mb-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariants}
          className="text-sm text-gray-500 mb-1"
        >
          UPPSKATTAT VÄRDE
        </motion.div>
        <div className="flex items-center justify-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-emerald-600"
          >
            {isLoading ? (
              <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                {displayValue?.toLocaleString()} kr
                <span className="text-sm font-bold text-emerald-600 ml-2">
                  INKL. MOMS
                </span>
              </>
            )}
          </motion.div>
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariants}
          transition={{ delay: 0.3 }}
          className="text-xs text-gray-500 mt-2 max-w-md mx-auto"
        >
          Detta är en uppskattning baserad på marknadsvärdet. Det slutliga
          priset kan variera beroende på bilens skick och aktuella
          marknadsförhållanden.
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {/* Model Info - Only render if make and model exist */}
          {carDetails?.make && carDetails?.model && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <Car className="w-5 h-5 text-[#55B7FF]" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">MODELL</div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="text-sm font-semibold">
                    {carDetails.make} {carDetails.model}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Year Info - Only render if year exists */}
          {carDetails?.year && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <Calendar className="w-5 h-5 text-[#55B7FF]" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">ÅRSMODELL</div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="text-sm font-semibold">{carDetails.year}</div>
                )}
              </div>
            </motion.div>
          )}

          {/* Mileage Info - Only render if mileage exists */}
          {carDetails?.mileage && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3"
            >
              <Gauge className="w-5 h-5 text-[#55B7FF]" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">UPPSKATTAT MILTAL</div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="text-sm font-semibold">
                    {carDetails.mileage}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tax Info - Only render if yearlyTax exists */}
          {carDetails?.yearlyTax && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-3"
            >
              <Receipt className="w-5 h-5 text-[#55B7FF]" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">ÅRSKATT</div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="text-sm font-semibold">
                    {carDetails.yearlyTax.toLocaleString()} kr
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Previous Owners Info - Only render if previousOwners exists */}
          {carDetails?.previousOwners && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3"
            >
              <Users className="w-5 h-5 text-[#55B7FF]" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">TIDIGARE ÄGARE</div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="text-sm font-semibold">
                    {carDetails.previousOwners}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Fuel Consumption Info - Only render if both mpg and fuel exist */}
          {carDetails?.mpg && carDetails?.fuel && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-3"
            >
              <Droplet className="w-5 h-5 text-[#55B7FF]" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">FÖRBRUKNING</div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="text-sm font-semibold">
                    {carDetails.mpg} l/100km
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
