import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../api/axios";
import AuthInput from "../../components/auth/AuthInput";

// Demo ke liye: Vercel ke environment variables mein yeh teeno rakhein
// (sirf limited staff account ka, KABHI Super Admin ka nahi)
const DEMO_ENABLED = import.meta.env.VITE_DEMO_MODE === "true";
const DEMO_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD;
const SHOW_DEMO_LOGIN = DEMO_ENABLED && DEMO_EMAIL && DEMO_PASSWORD;

export default function AdminLogin() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  if (user && ["admin", "staff"].includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  const signIn = async (email, password) => {
    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      if (!["admin", "staff"].includes(data.role)) {
        logout();
        toast.error("This account does not have admin access");
        return;
      }
      toast.success(`Welcome back, ${data.name}`);
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(form.email, form.password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-3 text-xl font-bold text-ink">Admin Login</h1>
          <p className="mt-1 text-sm text-muted">Restricted access for store administrators and staff.</p>
        </div>

        {SHOW_DEMO_LOGIN && (
          <div className="mt-6 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20">
            <p className="text-sm font-semibold text-ink">Portfolio demo</p>
            <p className="mt-1 text-xs text-muted">
              Explore the admin panel with a limited demo staff account ({DEMO_EMAIL}). It cannot see payments,
              store settings or staff management.
            </p>
            <button
              type="button"
              onClick={() => signIn(DEMO_EMAIL, DEMO_PASSWORD)}
              disabled={submitting}
              className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Login as demo admin"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <AuthInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <AuthInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link to="/" className="font-medium text-primary hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}