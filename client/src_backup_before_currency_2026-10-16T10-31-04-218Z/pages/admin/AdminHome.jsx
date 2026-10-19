import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_NAV, canSeeNavItem } from "../../adminPermissions";

// /admin par aate hi user ko uska pehla allowed section khol deta hai
export default function AdminHome() {
  const { user } = useAuth();
  const first = ADMIN_NAV.find((item) => canSeeNavItem(user, item));

  if (first) {
    return <Navigate to={first.to} replace />;
  }

  return (
    <div className="rounded-xl bg-amber-50 p-6 text-warning ring-1 ring-amber-200">
      No sections have been assigned to your account yet. Please ask the store admin to grant you access.
    </div>
  );
}