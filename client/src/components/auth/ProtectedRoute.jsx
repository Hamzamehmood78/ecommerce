import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../adminPermissions";

// adminOnly  : sirf Super Admin
// adminArea  : Super Admin ya Staff
// permission : Staff ke liye khaas section ki ijazat
export default function ProtectedRoute({ children, adminOnly = false, adminArea = false, permission }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const loginPath = adminOnly || adminArea ? "/admin/login" : "/login";
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (adminArea && !["admin", "staff"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (permission && !hasPermission(user, permission)) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-danger ring-1 ring-red-200">
        You don't have permission to access this section. Please ask the store admin to grant access.
      </div>
    );
  }

  return children;
}