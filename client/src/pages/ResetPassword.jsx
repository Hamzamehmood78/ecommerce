import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LinkIcon } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import AuthInput from "../components/auth/AuthInput";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking"); // checking | valid | invalid
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Form dikhane se pehle check karte hain ke link abhi bhi theek hai
  useEffect(() => {
    api
      .get(`/auth/reset-password/${token}`)
      .then(() => setStatus("valid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!form.password) next.password = "New password is required";
    else if (form.password.length < 6) next.password = "At least 6 characters";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: form.password });
      toast.success("Password reset successful. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      if (err.response?.status === 400 && /invalid or has expired/i.test(err.response?.data?.message || "")) {
        setStatus("invalid");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="mx-auto max-w-md animate-pulse px-4 py-24">
        <div className="h-40 rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <LinkIcon size={48} className="text-muted" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Link expired</h1>
        <p className="mt-2 text-sm text-muted">
          This reset link is invalid or has expired. Reset links work only once and last 30 minutes.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark"
        >
          Request a New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-ink">Set a New Password</h1>
      <p className="mt-1 text-sm text-muted">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <AuthInput
          label="New Password"
          type="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
        />
        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}