import { useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../api/axios";
import AuthInput from "../../components/auth/AuthInput";

export default function AdminLogin() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  if (user && ["admin", "staff"].includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(form.email.trim(), form.password);
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
                    <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}