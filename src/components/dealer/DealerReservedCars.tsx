import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color: string;
  description: string;
  image_urls: string[];
  reserved_by: string | null;
  reserved_at: string | null;
  payment_status: "UNPAID" | "PAID" | null;
}

interface Payment {
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  reference: string;
  amount: number;
}

interface Props {
  hideTitle?: boolean;
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

export default function DealerReservedCars({ hideTitle = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [reservedCars, setReservedCars] = useState<Car[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch reserved cars
  useEffect(() => {
    async function fetchReservedCars() {
      setLoading(true);
      setErrorMessage(null);

      try {
        if (!user) {
          console.error("No user found when trying to fetch reserved cars");
          setErrorMessage("You must be logged in to view your reserved cars");
          setLoading(false);
          return;
        }

        console.log("Fetching reserved cars for user ID:", user.id);

        // First log the exact query we're going to run
        console.log("Query: cars table where reserved_by =", user.id);

        // Run a direct query to see if it works
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .eq("reserved_by", user.id);

        if (carsError) {
          console.error("Error fetching reserved cars:", carsError);
          setErrorMessage(`Database error: ${carsError.message}`);

          if (carsError.code) {
            console.error(`Error code: ${carsError.code}`);
          }
          if (carsError.details) {
            console.error(`Error details: ${carsError.details}`);
          }
        } else {
          console.log("Reserved cars data:", carsData);
          if (carsData && carsData.length > 0) {
            setReservedCars(carsData);
          } else {
            console.log("No reserved cars found, attempting alternative query");

            // Try using 'status' field as an alternative
            const { data: statusData, error: statusError } = await supabase
              .from("cars")
              .select("*")
              .eq("status", "reserved");

            if (statusError) {
              console.error("Alternative query error:", statusError);
            } else {
              console.log("Status-based query results:", statusData);
              // If we can't directly link to users, we'll show all reserved cars
              // In a real app you'd want a more secure way to link cars to users
              setReservedCars(statusData || []);
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching cars:", error);
        setErrorMessage(
          "An unexpected error occurred. Please try again later."
        );
      }

      setLoading(false);
    }

    fetchReservedCars();
  }, [user, toast]);

  // Enhance diagnostic function to include schema information
  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const results: string[] = [];

      // Check authentication
      results.push(`User authenticated: ${!!user}`);
      if (user) {
        results.push(`User ID: ${user.id}`);
      }

      // Get car table schema
      const { data: schemaData, error: schemaError } = await supabase
        .from("cars")
        .select("*")
        .limit(1);

      if (schemaError) {
        results.push(`Cars table access error: ${schemaError.message}`);
      } else if (schemaData && schemaData.length > 0) {
        const fields = Object.keys(schemaData[0]);
        results.push(`Cars table fields: ${fields.join(", ")}`);
        results.push(
          `Has reserved_by field: ${fields.includes("reserved_by")}`
        );
        results.push(`Has status field: ${fields.includes("status")}`);

        // Check for potential owner fields
        const possibleOwnerFields = [
          "owner_id",
          "dealer_id",
          "user_id",
          "customer_id",
        ];
        const foundOwnerFields = possibleOwnerFields.filter((field) =>
          fields.includes(field)
        );
        results.push(
          `Potential owner fields: ${
            foundOwnerFields.length > 0
              ? foundOwnerFields.join(", ")
              : "None found"
          }`
        );
      } else {
        results.push("Cars table is empty");
      }

      // Check for RLS policies
      const { data: allCars, error: allCarsError } = await supabase
        .from("cars")
        .select("id")
        .limit(5);

      if (allCarsError) {
        results.push(`RLS restriction: ${allCarsError.message}`);
      } else {
        results.push(`Cars found: ${allCars ? allCars.length : 0}`);
      }

      // Display results
      console.log("Diagnostic results:", results);
      alert(
        "Diagnostics complete. Please check your browser console and share the results with your administrator.\n\n" +
          results.join("\n")
      );
    } catch (e) {
      console.error("Diagnostic error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Generate payment details
  function showPaymentDetails(car: Car) {
    setCurrentCar(car);

    // Generate dummy payment details
    const payment: Payment = {
      accountName: "GoGuda Cars Finance",
      bankName: "First National Bank",
      accountNumber: "1234567890",
      routingNumber: "987654321",
      reference: `CAR-${car.id.substring(0, 8)}`,
      amount: car.price,
    };

    setCurrentPayment(payment);
    setPaymentDialogOpen(true);
  }

  return (
    <div className="container mx-auto p-4">
      {!hideTitle && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reserved and Purchased Cars</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Hide Debug" : "Debug"}
          </Button>
        </div>
      )}

      {showDebug && (
        <div className="bg-gray-100 p-4 mb-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <p className="mb-2">
            If you're experiencing issues loading your reserved cars, click the
            button below to run diagnostics.
          </p>
          <Button
            variant="secondary"
            onClick={runDiagnostics}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Diagnostics"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your cars...</p>
        </div>
      ) : errorMessage ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
            {showDebug ? null : (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(true)}
                >
                  Show Diagnostics
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : reservedCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservedCars.map((car) => (
            <Card key={car.id} className="overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                <CarImageCarousel images={car.image_urls || []} />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={
                      car.payment_status === "PAID" ? "default" : "destructive"
                    }
                  >
                    {car.payment_status === "PAID" ? "PURCHASED" : "UNPAID"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-1">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-lg font-semibold text-green-600 mb-2">
                  ${car.price.toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">
                    {car.mileage.toLocaleString()} miles
                  </Badge>
                  <Badge variant="outline">{car.color}</Badge>
                </div>

                {car.payment_status !== "PAID" && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment Required</AlertTitle>
                    <AlertDescription>
                      This car requires payment to complete the purchase. Please
                      click the payment details button for information.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Reserved on:{" "}
                    {new Date(car.reserved_at || "").toLocaleDateString()}
                  </p>

                  {car.payment_status !== "PAID" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => showPaymentDetails(car)}
                    >
                      View Payment Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">No Cars Reserved</h3>
          <p className="text-gray-600 mb-4">
            You haven't reserved any cars yet. Browse the available inventory to
            find cars.
          </p>
          <Button variant="outline">Browse Available Cars</Button>
        </div>
      )}

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              {currentCar && (
                <span>
                  For {currentCar.year} {currentCar.make} {currentCar.model}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {currentPayment && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Wire Transfer Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Account Name:</div>
                  <div>{currentPayment.accountName}</div>

                  <div className="font-medium">Bank Name:</div>
                  <div>{currentPayment.bankName}</div>

                  <div className="font-medium">Account Number:</div>
                  <div>{currentPayment.accountNumber}</div>

                  <div className="font-medium">Routing Number:</div>
                  <div>{currentPayment.routingNumber}</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Payment Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Amount:</div>
                  <div className="font-bold">
                    ${currentPayment.amount.toLocaleString()}
                  </div>

                  <div className="font-medium">Reference:</div>
                  <div className="font-bold">{currentPayment.reference}</div>
                </div>
              </div>

              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Please include the reference number with your payment to
                  ensure proper processing. Once payment is confirmed, the
                  status will be updated to Purchased.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPaymentDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
