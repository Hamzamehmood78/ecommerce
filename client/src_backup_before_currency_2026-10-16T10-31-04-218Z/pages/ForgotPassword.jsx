import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import AuthInput from "../components/auth/AuthInput";

const emailRegex = /^\S+@\S+\.\S+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailRegex.test(email.trim())) {
      setError("Enter a valid email");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <MailCheck size={48} className="text-primary" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          If an account exists for <span className="font-medium text-ink">{email.trim()}</span>, we've sent a
          password reset link. It is valid for 30 minutes.
        </p>
        <Link to="/login" className="mt-6 text-sm font-semibold text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-ink">Forgot Password?</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          error={error}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}