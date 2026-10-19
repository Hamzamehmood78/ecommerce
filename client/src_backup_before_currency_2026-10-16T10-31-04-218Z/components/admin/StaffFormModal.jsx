import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../auth/AuthInput";
import { PERMISSION_OPTIONS } from "../../adminPermissions";

const emptyForm = { name: "", email: "", password: "", permissions: [] };

export default function StaffFormModal({ open, onClose, onSaved, editingStaff }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      setForm({
        name: editingStaff.name,
        email: editingStaff.email,
        password: "",
        permissions: editingStaff.permissions || [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingStaff, open]);

  if (!open) return null;

  const togglePermission = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const allSelected = form.permissions.length === PERMISSION_OPTIONS.length;
  const toggleAll = () => {
    setForm((f) => ({
      ...f,
      permissions: allSelected ? [] : PERMISSION_OPTIONS.map((p) => p.key),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editingStaff) {
      if (!form.email.trim() || !form.password) {
        toast.error("Email and password are required");
        return;
      }
    }
    if (form.password && form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaff) {
        const payload = { name: form.name, permissions: form.permissions };
        if (form.password) payload.password = form.password;
        await api.put(`/staff/${editingStaff._id}`, payload);
        toast.success("Staff updated");
      } else {
        await api.post("/staff", form);
        toast.success("Staff member added");
      }
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">{editingStaff ? "Edit Staff" : "Add Staff"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <AuthInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <AuthInput
            label="Email"
            type="email"
            value={form.email}
            disabled={!!editingStaff}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <AuthInput
            label={editingStaff ? "New Password (leave blank to keep current)" : "Password"}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-ink">Permissions</label>
              <button type="button" onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="grid gap-2 rounded-lg bg-surface p-3 sm:grid-cols-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(opt.key)}
                    onChange={() => togglePermission(opt.key)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Homepage Settings ke Featured picker ke liye Products permission bhi chahiye hoti hai.
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}