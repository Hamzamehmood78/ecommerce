import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShoppingBag as Logo } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_NAV, canSeeNavItem } from "../../adminPermissions";
import NotificationBell from "../notifications/NotificationBell";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Sirf wohi items jinki is user ko ijazat hai
  const navItems = ADMIN_NAV.filter((item) => canSeeNavItem(user, item));

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden h-screen w-60 flex-shrink-0 flex-col self-start bg-white shadow-sm lg:sticky lg:top-0 lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5 text-lg font-bold text-primary">
          <Logo size={22} /> Admin Panel
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-primary text-white" : "text-ink hover:bg-surface"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
          <span className="font-bold text-primary">Admin Panel</span>
          <button onClick={handleLogout} className="text-sm font-medium text-danger">Logout</button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-primary text-white" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 px-5 pt-4 text-sm text-muted">
                    <NotificationBell />
          <a href="/" className="mr-auto font-medium text-primary hover:underline">
            ← View store
          </a>
          Logged in as <span className="font-medium text-ink">{user?.name}</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {user?.role === "admin" ? "Super Admin" : "Staff"}
          </span>
        </div>

        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}