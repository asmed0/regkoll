import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, X, PencilIcon, Trash2 } from "lucide-react";

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
  image_url: string | null;
  description: string;
  status: "available" | "reserved" | "sold";
  payment_status: "unpaid" | "paid";
  reserved_by: string | null;
  created_at: string;
  reserved_at?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: string;
}

const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce
    .number()
    .min(1900, "Year must be valid")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  mileage: z.coerce.number().min(0, "Mileage must be valid"),
  price: z.coerce.number().min(0, "Price must be valid"),
  status: z.enum(["available", "reserved", "sold"]),
  payment_status: z.enum(["unpaid", "paid"]),
});

const AdminInventory = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [openCarId, setOpenCarId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      price: 0,
      status: "available",
      payment_status: "unpaid",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (openCarId) {
      const car = cars.find((car) => car.id === openCarId);
      if (car) {
        form.reset({
          make: car.make || "",
          model: car.model || "",
          year: car.year || new Date().getFullYear(),
          mileage: car.mileage || 0,
          price: car.price || 0,
          status: car.status || "available",
          payment_status: car.payment_status || "unpaid",
        });
      }
    }
  }, [openCarId, cars, form]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch cars
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (carsError) throw carsError;
      setCars(carsData || []);

      // Fetch profiles for dealer names
      if (carsData) {
        const reservedByIds = carsData
          .filter((car) => car.reserved_by)
          .map((car) => car.reserved_by)
          .filter((id): id is string => id !== null);

        if (reservedByIds.length > 0) {
          console.log("Fetching profiles for dealer IDs:", reservedByIds);

          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, email, role")
            .in("id", reservedByIds);

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            toast({
              title: "Error",
              description: "Failed to fetch dealer information",
              variant: "destructive",
            });
          } else {
            console.log("Fetched profiles:", profilesData);
            setProfiles(profilesData || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCarStatus = async (carId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ status })
        .eq("id", carId);

      if (error) throw error;

      setCars((prevCars) =>
        prevCars.map((car) =>
          car.id === carId
            ? { ...car, status: status as "available" | "reserved" | "sold" }
            : car
        )
      );

      toast({
        title: "Status updated",
        description: `Car status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating car status:", error);
      toast({
        title: "Error",
        description: "Failed to update car status",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (carId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ payment_status: paymentStatus })
        .eq("id", carId);

      if (error) throw error;

      setCars((prevCars) =>
        prevCars.map((car) =>
          car.id === carId
            ? { ...car, payment_status: paymentStatus as "unpaid" | "paid" }
            : car
        )
      );

      toast({
        title: "Payment status updated",
        description: `Car payment status updated to ${paymentStatus}`,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const deleteCar = async () => {
    if (!carToDelete) return;

    try {
      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", carToDelete);

      if (error) throw error;

      setCars((prevCars) => prevCars.filter((car) => car.id !== carToDelete));
      setCarToDelete(null);

      toast({
        title: "Car deleted",
        description: "Car has been removed from inventory",
      });
    } catch (error) {
      console.error("Error deleting car:", error);
      toast({
        title: "Error",
        description: "Failed to delete car",
        variant: "destructive",
      });
    }
  };

  const getDealerName = (dealerId: string | null) => {
    if (!dealerId) return "N/A";
    const profile = profiles.find((p) => p.id === dealerId);

    // Display email as primary identifier, with name in parentheses if available
    if (profile) {
      if (profile.name) {
        return `${profile.email} (${profile.name})`;
      }
      return profile.email;
    }

    return "Unknown User";
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === "available") {
      return (
        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
          Available
        </Badge>
      );
    } else if (status === "reserved") {
      if (paymentStatus === "paid") {
        return (
          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
            Reserved (Paid)
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">
            Reserved (Unpaid)
          </Badge>
        );
      }
    } else if (status === "sold") {
      return (
        <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
          Sold
        </Badge>
      );
    }
    return null;
  };

  // Filter cars based on active tab
  const filteredCars = cars.filter((car) => {
    if (activeTab === "all") return true;
    if (activeTab === "available") return car.status === "available";
    if (activeTab === "reserved") return car.status === "reserved";
    if (activeTab === "sold") return car.status === "sold";
    return true;
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!openCarId) return;

      const { error } = await supabase
        .from("cars")
        .update({
          make: values.make,
          model: values.model,
          year: values.year,
          mileage: values.mileage,
          price: values.price,
          status: values.status,
          payment_status: values.payment_status,
        })
        .eq("id", openCarId);

      if (error) throw error;

      toast({
        title: "Car updated",
        description: "The car details have been updated successfully",
      });

      fetchData();
      setOpenCarId(null);
    } catch (error: any) {
      console.error("Error updating car:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update car details",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (car: Car) => {
    setCarToDelete(car.id);
    setDeleteDialogOpen(true);
  };

  const togglePaymentStatus = async (car: Car) => {
    try {
      const newPaymentStatus =
        car.payment_status === "paid" ? "unpaid" : "paid";

      const { error } = await supabase
        .from("cars")
        .update({
          payment_status: newPaymentStatus,
          // If payment is marked as paid and the car is reserved, update status to sold
          status:
            newPaymentStatus === "paid" && car.status === "reserved"
              ? "sold"
              : car.status,
        })
        .eq("id", car.id);

      if (error) throw error;

      toast({
        title: `Payment ${
          newPaymentStatus === "paid" ? "Confirmed" : "Marked as Unpaid"
        }`,
        description: `The car has been marked as ${newPaymentStatus}${
          newPaymentStatus === "paid" ? " and status updated to sold" : ""
        }`,
      });

      fetchData();
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Car Inventory</h2>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Cars</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="reserved">Reserved</TabsTrigger>
          <TabsTrigger value="sold">Sold</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#55B7FF]"></div>
        </div>
      ) : filteredCars.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No cars found in this category.
        </p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reserved By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium">
                    {car.make} {car.model} ({car.year})
                  </TableCell>
                  <TableCell>{car.price.toLocaleString()} SEK</TableCell>
                  <TableCell>
                    {getStatusBadge(car.status, car.payment_status)}
                  </TableCell>
                  <TableCell>
                    {car.reserved_by ? (
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium">
                          {getDealerName(car.reserved_by)}
                        </span>
                        {car.reserved_at && (
                          <span className="text-xs text-gray-500">
                            Reserved on:{" "}
                            {new Date(car.reserved_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not reserved</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Select
                        value={car.status}
                        onValueChange={(value) =>
                          updateCarStatus(car.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>

                      {(car.status === "reserved" || car.status === "sold") && (
                        <Select
                          value={car.payment_status}
                          onValueChange={(value) =>
                            updatePaymentStatus(car.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Payment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(car)}
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete this car?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the car from the inventory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={deleteCar}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Car Sheet */}
      <Sheet open={!!openCarId} onOpenChange={() => setOpenCarId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Car</SheetTitle>
            <SheetDescription>
              Update the details for this car in your inventory
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Corolla" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 2020"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage (km)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SEK)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 150000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={form.watch("status") === "available"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {form.watch("status") === "available"
                          ? "Payment status can only be set for reserved or sold cars"
                          : ""}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenCarId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {carToDelete && `this car`}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCar}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventory;
