import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, UserRole, getCurrentUser, getUserRole } from "./supabase";

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUserAndRole: (user: User | null, role: UserRole | null) => void;
}

// Default context with no loading state to allow UI to render immediately
const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: false,
  refreshUser: async () => {},
  setUserAndRole: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid blocking UI

  // Direct setter for user and role - useful for immediate updates from Login
  const setUserAndRole = (newUser: User | null, newRole: UserRole | null) => {
    setUser(newUser);
    setUserRole(newRole);
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();

      // If no user, clear state and return early
      if (!currentUser) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Set user first
      setUser(currentUser);

      // Then get and set role
      try {
        const role = await getUserRole();
        setUserRole(role);
      } catch (roleError) {
        console.error("Error getting user role:", roleError);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      // Fail silently and just treat as not logged in
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Background check for current user - don't block rendering
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        // If no user, nothing more to do
        if (!currentUser) {
          return;
        }

        // Set user immediately when found
        setUser(currentUser);

        // Then try to get role
        try {
          const role = await getUserRole();
          setUserRole(role);
        } catch (roleError) {
          console.error("Error getting user role:", roleError);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        // Don't show errors to users, just treat as not logged in
      }
    };

    // Check auth without blocking render
    checkAuth();

    // Set up auth state listener for future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          if (session?.user) {
            // Set user immediately from the session
            setUser(session.user);

            // Then try to get role
            try {
              const role =
                (session.user.user_metadata?.role as UserRole) || null;
              setUserRole(role);
            } catch (roleError) {
              console.error("Error getting user role from session:", roleError);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Provide auth context to child components
  const value = {
    user,
    userRole,
    loading,
    refreshUser,
    setUserAndRole,
  };

  // Always render children regardless of auth state
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
