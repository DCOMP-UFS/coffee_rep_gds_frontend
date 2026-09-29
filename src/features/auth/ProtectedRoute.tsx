import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth/token";

/** Mesma regra do `AuthGuard` do Angular: basta existir o cookie do token. */
export function ProtectedRoute() {
	return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}
