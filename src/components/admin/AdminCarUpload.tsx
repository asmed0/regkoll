import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Report {
  Chassinummer?: string;
  RegistreringTillvDatum?: string;
  Bränsle?: string;
  Färg?: string;
  Servicedokumentation?: string;
  SenasteService?: { km: number; datum: string };
  Kund?: string;
  KosmetiskKlassificering?: string;
  Registreringsnummer?: string;
  MekaniskGradering?: string;
  Fordonsdata?: {
    Modell: string;
    Motor: string;
    Växellåda: string;
    Effekt: string;
    Årsmodell: string;
  };
  Vägmätaravläsning?: string;
  Inspektionsdatum?: string;
  Inspektionsplats?: string;
  AntalNycklar?: number;
  Servicehistorik?: number[];
  Ankomstdatum?: string;
  MonteradeDäck?: { Typ: string; Dimension: string; Mönsterdjup_mm: number[] };
  OmonteradeDäck?: { Typ: string; Dimension: string; Mönsterdjup_mm: number[] };
  Utrustning?: string[];
  KommentarerTestkörning?: string;
  Skador?: { Nr: number; Komponent: string; Skada: string }[];
}

const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(1, "Year is required"),
  mileage: z.string().min(1, "Mileage is required"),
  price: z.string().min(1, "Price is required"),
  color: z.string().min(1, "Color is required"),
  fuel_type: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  description: z.string().min(1, "Description is required"),
  image_urls: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

type PreviewImage = {
  file: File;
  preview: string;
};

const AdminCarUpload = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      mileage: "",
      price: "ON REQUEST - CONTACT WHATSAPP",
      color: "",
      fuel_type: "",
      transmission: "",
      description: "",
      image_urls: [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPreviewImages: PreviewImage[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviewImages((prev) => [...prev, ...newPreviewImages]);
  };

  const handleRemoveImage = (index: number) => {
    setPreviewImages((prev) => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
    if (currentImageIndex >= previewImages.length - 1) {
      setCurrentImageIndex(Math.max(0, previewImages.length - 2));
    }
  };

  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      try {
        // Generate a unique file name
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;
        const filePath = `car-images/${fileName}`;

        // Upload the file to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("car-images").getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const handlePdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const pdfFile = files[0];

    if (pdfFile.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size - warn if larger than 4MB
    if (pdfFile.size > 4 * 1024 * 1024) {
      toast({
        title: "Large File",
        description:
          "The file is large and may take longer to process. Please be patient.",
      });
    }

    setIsPdfProcessing(true);

    try {
      // Convert the PDF file to Base64
      const base64PDF = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            // Extract the base64 content part (remove the data URI prefix)
            const base64Content = reader.result.split(",")[1];
            resolve(base64Content);
          } else {
            reject(new Error("Failed to read file as base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });

      // Check if we need to compress or process in chunks
      if (base64PDF.length > 5 * 1024 * 1024) {
        // If > 5MB, simplify to avoid timeouts
        toast({
          title: "File too large",
          description:
            "This PDF is too large for online processing. Please try a smaller file (under 5MB).",
          variant: "destructive",
        });
        setIsPdfProcessing(false);
        if (pdfFileRef.current) {
          pdfFileRef.current.value = "";
        }
        return;
      }

      // Log size for debugging
      console.log(`PDF Base64 size: ${base64PDF.length} characters`);

      // Send the PDF as base64 to our API
      const response = await fetch("/api/extractReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdfBase64: base64PDF }),
      });

      if (!response.ok) {
        console.error("Response status:", response.status);
        let errorMessage = "Failed to process PDF";
        try {
          const errorData = await response.json();
          console.error("Error data:", errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response", e);
        }
        throw new Error(errorMessage);
      }

      const { report, imageDataUrls } = await response.json();

      // Update form values from the extracted report data
      if (report.Fordonsdata) {
        // Extract make from model (e.g., "Volkswagen Golf" -> "Volkswagen")
        const make = report.Fordonsdata.Modell.split(" ")[0];
        const model = report.Fordonsdata.Modell.replace(make + " ", "");

        form.setValue("make", make);
        form.setValue("model", model);
        form.setValue("year", report.Fordonsdata.Årsmodell);
        form.setValue("transmission", report.Fordonsdata.Växellåda);
      }

      if (report.Vägmätaravläsning) {
        // Extract numeric part from "123 456 km"
        const mileage = report.Vägmätaravläsning.replace(/\s+/g, "").replace(
          "km",
          ""
        );
        form.setValue("mileage", mileage);
      }

      if (report.Bränsle) {
        form.setValue("fuel_type", report.Bränsle);
      }

      if (report.Färg) {
        form.setValue("color", report.Färg);
      }

      // Create description from various report properties
      let description = "";

      if (report.Chassinummer) {
        description += `Chassis Number: ${report.Chassinummer}\n`;
      }

      if (report.Registreringsnummer) {
        description += `Registration Number: ${report.Registreringsnummer}\n`;
      }

      if (report.KosmetiskKlassificering) {
        description += `Cosmetic Classification: ${report.KosmetiskKlassificering}\n`;
      }

      if (report.MekaniskGradering) {
        description += `Mechanical Grading: ${report.MekaniskGradering}\n`;
      }

      if (report.Utrustning && report.Utrustning.length > 0) {
        description += `\nEquipment:\n• ${report.Utrustning.join("\n• ")}\n`;
      }

      if (report.Skador && report.Skador.length > 0) {
        description += `\nDamage Report:\n`;
        report.Skador.forEach((skada) => {
          description += `${skada.Nr}. ${skada.Komponent} - ${skada.Skada}\n`;
        });
      }

      if (report.KommentarerTestkörning) {
        description += `\nTest Drive Comments: ${report.KommentarerTestkörning}\n`;
      }

      form.setValue("description", description);

      // Convert data URLs to File objects and add to previewImages
      if (imageDataUrls && imageDataUrls.length > 0) {
        const newImages: PreviewImage[] = await Promise.all(
          imageDataUrls.map(async (dataUrl, index) => {
            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File(
              [blob],
              `image_${index + 1}.${
                dataUrl.includes("image/jpeg") ? "jpg" : "png"
              }`,
              {
                type: dataUrl.includes("image/jpeg")
                  ? "image/jpeg"
                  : "image/png",
              }
            );

            return {
              file,
              preview: dataUrl,
            };
          })
        );

        setPreviewImages(newImages);
      }

      toast({
        title: "PDF Processed Successfully",
        description:
          "Form has been filled with data from the inspection report",
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process the PDF file. Please try again or fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setIsPdfProcessing(false);
      // Reset the file input
      if (pdfFileRef.current) {
        pdfFileRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];

      // Upload images if there are any
      if (previewImages.length > 0) {
        imageUrls = await uploadImagesToSupabase(
          previewImages.map((img) => img.file)
        );
      }

      // Insert car data to DB
      const { error } = await supabase.from("cars").insert({
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        mileage: parseInt(data.mileage),
        price:
          data.price === "ON REQUEST - CONTACT WHATSAPP"
            ? 0
            : parseInt(data.price),
        color: data.color,
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        description: data.description,
        image_urls: imageUrls,
        status: "available",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Car uploaded to inventory successfully",
      });

      // Reset form
      form.reset();
      setPreviewImages([]);
      setCurrentImageIndex(0);
    } catch (error: any) {
      console.error("Error uploading car:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload car",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual">
        <TabsList className="mb-4">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="pdf">PDF Import</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <p className="text-muted-foreground mb-6">
            Fill in car details manually using the form below.
          </p>
        </TabsContent>

        <TabsContent value="pdf">
          <div className="mb-6 space-y-4">
            <p className="text-muted-foreground">
              Upload an inspection report PDF to automatically fill the form
              fields.
            </p>

            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={pdfFileRef}
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                disabled={isPdfProcessing}
              />

              <Button
                type="button"
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => pdfFileRef.current?.click()}
                disabled={isPdfProcessing}
              >
                {isPdfProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Upload PDF Report</span>
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                The system will extract information from the PDF and populate
                the form fields. Price will be set to "ON REQUEST - CONTACT
                WHATSAPP" as per requirement. You can adjust any fields after
                the extraction is complete.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input placeholder="e.g. Camry" {...field} />
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
                    <Input placeholder="e.g. 2023" {...field} />
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
                    <Input placeholder="e.g. 15000" {...field} />
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
                    <Input placeholder="e.g. 250000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Blue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fuel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gasoline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transmission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transmission</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Automatic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter car description..."
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel>Car Images</FormLabel>
            <div className="flex flex-col gap-4">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                multiple
                className="max-w-sm"
              />

              {previewImages.length > 0 && (
                <div className="relative w-full max-w-2xl mx-auto">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <img
                      src={previewImages[currentImageIndex].preview}
                      alt={`Car image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Navigation buttons */}
                    {previewImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentImageIndex(
                              (prev) =>
                                (prev - 1 + previewImages.length) %
                                previewImages.length
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentImageIndex(
                              (prev) => (prev + 1) % previewImages.length
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(currentImageIndex)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Thumbnail strip */}
                  {previewImages.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {previewImages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-12 rounded-md overflow-hidden ${
                            index === currentImageIndex
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                        >
                          <img
                            src={previewImages[index].preview}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload Car"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AdminCarUpload;
