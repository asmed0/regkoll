import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { X } from "lucide-react";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  color: string;
  fuel_type: string;
  transmission: string;
  description: string;
  image_urls: string[];
  status: "available" | "sold" | "reserved";
  created_at: string;
}

const CarImageCarousel = ({ images }: { images: string[] }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEnlarged, setShowEnlarged] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div
        className="relative w-full h-48 group cursor-pointer"
        onClick={() => setShowEnlarged(true)}
      >
        <img
          src={images[currentImageIndex]}
          alt={`Car image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={showEnlarged} onOpenChange={setShowEnlarged}>
        <DialogContent className="max-w-4xl">
          <div className="relative">
            <img
              src={images[currentImageIndex]}
              alt={`Car image ${currentImageIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function DealerAvailableCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAvailableCars();
  }, []);

  const fetchAvailableCars = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCars(data || []);
    } catch (error) {
      console.error("Error fetching available cars:", error);
      toast({
        title: "Error",
        description: "Failed to load available cars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reserveCar = async (car: Car) => {
    try {
      if (!user || !user.id) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to reserve a car",
        });
        return;
      }

      setReserving(true);

      console.log("Reserving car with ID:", car.id, "for user:", user.id);

      // Update the car with the user's ID and current timestamp
      const { data, error } = await supabase
        .from("cars")
        .update({
          reserved_by: user.id,
          reserved_at: new Date().toISOString(),
          status: "reserved",
          payment_status: "UNPAID",
        })
        .eq("id", car.id)
        .select();

      if (error) {
        console.error("Error reserving car:", error);
        toast({
          variant: "destructive",
          title: "Reservation Failed",
          description: error.message,
        });
        return;
      }

      console.log("Reservation result:", data);
      toast({
        title: "Car Reserved",
        description: `You have successfully reserved the ${car.year} ${car.make} ${car.model}.`,
      });

      // Close the dialog if open
      setShowDialog(false);

      // Refresh the available cars list
      fetchAvailableCars();
    } catch (error: any) {
      console.error("Error in reserveCar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reserve car",
      });
    } finally {
      setReserving(false);
    }
  };

  const viewDetails = (car: Car) => {
    setSelectedCar(car);
    setShowDialog(true);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#55B7FF]"></div>
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No available cars at the moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car) => (
            <Card key={car.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <CarImageCarousel images={car.image_urls || []} />
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">
                  {car.make} {car.model}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {car.year} • {car.mileage.toLocaleString()} km
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{car.color}</Badge>
                  <Badge variant="outline">{car.fuel_type}</Badge>
                  <Badge variant="outline">{car.transmission}</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <p className="text-lg font-bold">
                  {car.price.toLocaleString()} SEK
                </p>
                <Button size="sm" onClick={() => viewDetails(car)}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Car details dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedCar && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedCar.make} {selectedCar.model}
                </DialogTitle>
                <DialogDescription>
                  {selectedCar.year} • {selectedCar.mileage.toLocaleString()} km
                </DialogDescription>
              </DialogHeader>

              <div className="relative w-full h-48 mb-4">
                <CarImageCarousel images={selectedCar.image_urls || []} />
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Color</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCar.color}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fuel Type</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCar.fuel_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Transmission</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCar.transmission}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Price</p>
                    <p className="text-sm font-bold">
                      {selectedCar.price.toLocaleString()} SEK
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCar.description}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => reserveCar(selectedCar)}
                  disabled={reserving}
                >
                  {reserving ? "Reserving..." : "Reserve Car"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
