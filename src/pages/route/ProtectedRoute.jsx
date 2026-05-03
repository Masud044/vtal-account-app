// src/components/ProtectedRoute.jsx
import { useAuthV2 } from "@/features/authentication-v2/use-auth-v2";
import { Navigate } from "react-router-dom";
// import { useAuthV2 } from "@/features/authentication-v2/use-auth-v2";

const ProtectedRoute = ({ children, anyRole }) => {
  const { user, isLoading, isAuthenticated } = useAuthV2();

  // Token check চলছে — wait করো
  if (isLoading) return null;

  // Login করা নেই
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role check
  if (anyRole && !anyRole.some((r) => user?.roles?.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;