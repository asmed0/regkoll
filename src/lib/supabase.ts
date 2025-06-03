import { createClient } from "@supabase/supabase-js";

// Default to empty strings if environment variables are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for users
export type UserRole = "dealer" | "admin";

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  company?: string;
  created_at: string;
}

export interface ProfileData {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  company?: string;
  created_at: string;
}

// Helper functions for authentication using real Supabase
export const signInWithEmail = async (email: string, password: string) => {
  // First authenticate the user
  const authResponse = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If authentication was successful, fetch the user's profile
  if (authResponse.data?.user && !authResponse.error) {
    try {
      const userId = authResponse.data.user.id;
      const profileData = await getUserProfile(userId);

      // Return both auth data and profile data
      return {
        ...authResponse,
        data: {
          ...authResponse.data,
          profile: profileData,
        },
      };
    } catch (error) {
      console.error("Error fetching profile after login:", error);
    }
  }

  // Return original response if profile fetch failed or auth failed
  return authResponse;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: Partial<UserData>
) => {
  const authResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        email: email,
      },
    },
  });

  // If sign up was successful, create a profile for the user
  if (authResponse.data?.user && !authResponse.error) {
    try {
      await createUserProfile(authResponse.data.user.id, email, {
        role: userData.role || "dealer",
        name: userData.name,
        company: userData.company,
      });
    } catch (profileError) {
      console.error("Failed to create user profile:", profileError);
    }
  }

  return authResponse;
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const { data } = await supabase.auth.getUser();

    if (!data.user) return null;

    // Get role from the profiles table
    const profile = await getUserProfile(data.user.id);

    if (profile?.role) {
      // Validate it's one of our expected roles
      const role = profile.role.toLowerCase() as UserRole;
      if (role === "admin" || role === "dealer") {
        console.log(`Found valid role in profile: ${role}`);
        return role;
      }
    }

    // If no valid role in profile, check email as a fallback
    const email = data.user.email?.toLowerCase();
    if (email?.includes("admin")) {
      console.log("Assigning admin role based on email");
      if (data.user.email) {
        await updateUserProfile(data.user.id, { role: "admin" });
      }
      return "admin";
    } else if (email?.includes("dealer")) {
      console.log("Assigning dealer role based on email");
      if (data.user.email) {
        await updateUserProfile(data.user.id, { role: "dealer" });
      }
      return "dealer";
    }

    // If we got this far, we don't have a valid role
    console.warn(`User ${data.user.email} has no valid role assigned.`);
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

// Get user profile from profiles table
export const getUserProfile = async (
  userId: string
): Promise<ProfileData | null> => {
  try {
    console.log(`Fetching profile for user ${userId}`);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    if (!data) {
      console.warn(`No profile found for user ${userId}`);
      return null;
    }

    return data as ProfileData;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

// Create user profile in profiles table
export const createUserProfile = async (
  userId: string,
  email: string,
  profileData: { role: UserRole; name?: string; company?: string }
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      email: email,
      role: profileData.role,
      name: profileData.name || null,
      company: profileData.company || null,
    });

    if (error) {
      console.error("Error creating user profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error creating profile:", error);
    return false;
  }
};

// Update user profile in profiles table
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Omit<ProfileData, "id" | "created_at">>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error updating profile:", error);
    return false;
  }
};
