import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
