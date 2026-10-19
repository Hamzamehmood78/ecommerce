import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import AuthInput from "../components/auth/AuthInput";
import { useAuth } from "../context/AuthContext";

export default function ContactUs() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">Contact Us</h1>
      <p className="mt-2 text-muted">Have a question? We'd love to hear from you.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <AuthInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <AuthInput label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Message</label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
            <Mail size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-medium text-ink">Email</p>
              <p className="text-sm text-muted">support@shopease.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
            <Phone size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-medium text-ink">Phone</p>
              <p className="text-sm text-muted">+92 300 1234567</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
            <MapPin size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-medium text-ink">Address</p>
              <p className="text-sm text-muted">Gujrat, Punjab, Pakistan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}