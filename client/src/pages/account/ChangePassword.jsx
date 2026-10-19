import { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../../components/auth/AuthInput";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePassword() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!form.currentPassword) next.currentPassword = "Current password is required";
    if (!form.newPassword) next.newPassword = "New password is required";
    else if (form.newPassword.length < 6) next.newPassword = "At least 6 characters";
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await api.put("/account/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password updated");
      setForm(emptyForm);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-ink">Change Password</h2>

      <div className="mt-5 space-y-4">
        <AuthInput
          label="Current Password"
          type="password"
          value={form.currentPassword}
          onChange={handleChange("currentPassword")}
          error={errors.currentPassword}
        />
        <AuthInput
          label="New Password"
          type="password"
          value={form.newPassword}
          onChange={handleChange("newPassword")}
          error={errors.newPassword}
        />
        <AuthInput
          label="Confirm New Password"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {saving ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}