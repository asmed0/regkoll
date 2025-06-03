import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { UserRole } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Protected route component that only protects admin and dealer routes
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading state only when we're trying to check auth for protected routes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#55B7FF]"></div>
      </div>
    );
  }

  // Very basic protection - send to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Simple role-based access control
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    const redirectPath = userRole === "admin" ? "/admin" : "/dealer";
    return <Navigate to={redirectPath} replace />;
  }

  // Allow access to the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
