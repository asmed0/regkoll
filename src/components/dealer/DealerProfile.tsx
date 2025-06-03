import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Profile {
  id: string;
  name: string;
  dealership_name: string;
  address: string;
  phone: string;
  email: string;
}

interface Props {
  hideTitle?: boolean;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  dealership_name: z.string().min(2, {
    message: "Dealership name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
});

export default function DealerProfile({ hideTitle = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dealership_name: "",
      address: "",
      phone: "",
    },
  });

  // Fetch dealer profile
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      if (user) {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setProfile(profileData);
          form.reset({
            name: profileData.name || "",
            dealership_name: profileData.dealership_name || "",
            address: profileData.address || "",
            phone: profileData.phone || "",
          });
        }
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, form]);

  // Save dealer profile
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: values.name,
        dealership_name: values.dealership_name,
        address: values.address,
        phone: values.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message,
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }
  }

  return (
    <div className="container mx-auto p-4">
      {!hideTitle && <h2 className="text-2xl font-bold mb-6">My Profile</h2>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {profile && (
                <div className="mb-6 pb-6 border-b">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dealership_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dealership Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your dealership name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
