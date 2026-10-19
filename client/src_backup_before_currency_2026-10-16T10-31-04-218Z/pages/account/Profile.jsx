import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Loader2 } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import AuthInput from "../../components/auth/AuthInput";

const emailRegex = /^\S+@\S+\.\S+$/;

export default function Profile() {
  const { updateUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", avatar: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .get("/account/profile")
      .then(({ data }) =>
        setForm({ name: data.name, email: data.email, phone: data.phone, avatar: data.avatar })
      )
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const { data } = await api.post("/upload/avatar", formData);
      setForm((f) => ({ ...f, avatar: data.url }));
      toast.success("Photo uploaded. Click Save Changes to keep it.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!emailRegex.test(form.email.trim())) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const { data } = await api.put("/account/profile", form);
      updateUser({ name: data.name, email: data.email, phone: data.phone });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-ink">Profile</h2>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-primary/10">
          {form.avatar ? (
            <img src={form.avatar} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
              {form.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface disabled:opacity-60"
          >
            <Camera size={16} /> {form.avatar ? "Change Photo" : "Upload Photo"}
          </button>
          {form.avatar && (
            <button
              type="button"
              onClick={() => setForm({ ...form, avatar: "" })}
              className="text-xs font-medium text-danger hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
      </div>

      <div className="mt-6 space-y-4">
        <AuthInput label="Full Name" value={form.name} onChange={handleChange("name")} error={errors.name} />
        <AuthInput label="Email" type="email" value={form.email} onChange={handleChange("email")} error={errors.email} />
        <AuthInput label="Phone" value={form.phone} onChange={handleChange("phone")} placeholder="03001234567" />
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}