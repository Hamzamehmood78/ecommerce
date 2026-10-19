import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, Package, MapPin, Heart, Lock, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const tabs = [
  { to: "/account", label: "Profile", icon: User, end: true },
  { to: "/account/orders", label: "My Orders", icon: Package },
  { to: "/account/addresses", label: "My Addresses", icon: MapPin },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/password", label: "Change Password", icon: Lock },
];

export default function AccountLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">My Account</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-4">
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-primary text-white" : "text-ink hover:bg-surface"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}