import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import Sell from "./pages/Sell";
import NotFound from "./pages/NotFound";
import CarValuation from "./pages/CarValuation";
import CarSellForm from "./components/CarSellForm";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Dealer from "@/pages/Dealer";
import { signOut } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const queryClient = new QueryClient();

const AppContent = () => {
  const [language, setLanguage] = useState<"sv" | "en">("sv");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDomain, setCurrentDomain] = useState<"gouda" | "taxi">("gouda");
  const { user, userRole, refreshUser } = useAuth();

  useEffect(() => {
    // Check if the current domain contains 'taxi'
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes("taxi")) {
      setCurrentDomain("taxi");
    } else {
      setCurrentDomain("gouda");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      // Force refresh the auth state
      await refreshUser();
      // Navigate to home page
      navigate("/");
      // Show success toast
      toast({
        title: "Logged out",
        description:
          language === "sv" ? "Du har loggat ut" : "You have been logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  // Always render the UI regardless of auth state
  return (
    <>
      <SEO language={language} path={location.pathname} />
      <div
        className={`min-h-screen bg-background font-sans antialiased ${
          currentDomain === "taxi" ? "taxi-theme" : ""
        }`}
      >
        {/* Fixed Header */}
        <div
          className={`fixed top-0 left-0 right-0 bg-white border-b ${
            currentDomain === "taxi" ? "border-[#FFD700]/10" : "border-gray-100"
          } z-50`}
        >
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/">
                <img
                  src={
                    currentDomain === "taxi"
                      ? "/images/taxi-logo.svg"
                      : "/images/gouda-cars-logo.png"
                  }
                  alt={
                    currentDomain === "taxi"
                      ? "Vi Köper Din Taxi Logo"
                      : "Gouda Cars Logo"
                  }
                  className="h-10 w-auto"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    cn(
                      "text-sm font-medium transition-colors hover:text-[#55B7FF]",
                      isActive ? "text-[#55B7FF]" : "text-gray-600"
                    )
                  }
                >
                  {language === "sv" ? "Hem" : "Home"}
                </NavLink>
                <NavLink
                  to="/sell"
                  className={({ isActive }) =>
                    cn(
                      "text-sm font-medium transition-colors hover:text-[#55B7FF]",
                      isActive ? "text-[#55B7FF]" : "text-gray-600"
                    )
                  }
                >
                  {language === "sv" ? "Sälj din bil" : "Sell your car"}
                </NavLink>

                {/* Show dealer dashboard link for authenticated dealers */}
                {user && userRole === "dealer" && (
                  <NavLink
                    to="/dealer"
                    className={({ isActive }) =>
                      cn(
                        "text-sm font-medium transition-colors hover:text-[#55B7FF]",
                        isActive ? "text-[#55B7FF]" : "text-gray-600"
                      )
                    }
                  >
                    {language === "sv" ? "Min Dashboard" : "My Dashboard"}
                  </NavLink>
                )}

                {/* Show admin dashboard link for authenticated admins */}
                {user && userRole === "admin" && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cn(
                        "text-sm font-medium transition-colors hover:text-[#55B7FF]",
                        isActive ? "text-[#55B7FF]" : "text-gray-600"
                      )
                    }
                  >
                    {language === "sv" ? "Admin" : "Admin"}
                  </NavLink>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-10 h-10 ${
                    language === "sv" ? "bg-gray-50" : ""
                  }`}
                  onClick={() => setLanguage("sv")}
                >
                  🇸🇪
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-10 h-10 ${
                    language === "en" ? "bg-gray-50" : ""
                  }`}
                  onClick={() => setLanguage("en")}
                >
                  🇬🇧
                </Button>
              </div>

              {user ? (
                // Show logout button when user is logged in
                <Button
                  variant="outline"
                  className={
                    currentDomain === "taxi"
                      ? "border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
                      : "border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
                  }
                  onClick={handleLogout}
                >
                  {language === "sv" ? "Logga ut" : "Logout"}
                </Button>
              ) : (
                // Show login button when no user is logged in
                <Link to="/login">
                  <Button
                    variant="outline"
                    className={
                      currentDomain === "taxi"
                        ? "border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
                        : "border-[#55B7FF] text-[#55B7FF] hover:bg-[#55B7FF]/10"
                    }
                  >
                    {language === "sv" ? "Återförsäljarinlogg" : "Dealer Login"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Content with padding for fixed header */}
        <div className="pt-16">
          <Toaster />
          <Sonner />

          {/* Always render routes */}
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <Home language={language} currentDomain={currentDomain} />
              }
            />
            <Route
              path="/sell"
              element={
                <Sell language={language} currentDomain={currentDomain} />
              }
            />
            <Route
              path="/car-valuation"
              element={<CarValuation currentDomain={currentDomain} />}
            />
            <Route
              path="/car-sell-form"
              element={
                <CarSellForm
                  language={language}
                  currentDomain={currentDomain}
                />
              }
            />
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealer"
              element={
                <ProtectedRoute allowedRoles={["dealer"]}>
                  <Dealer />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

// Top-level App component
const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
