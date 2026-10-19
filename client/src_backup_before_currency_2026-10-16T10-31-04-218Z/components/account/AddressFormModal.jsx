import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import AuthInput from "../auth/AuthInput";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  isDefault: false,
};

// Account page aur Checkout dono isi form ko istemal karte hain
export default function AddressFormModal({ open, onClose, onSaved, editingAddress }) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setErrors({});
    if (editingAddress) {
      setForm({
        fullName: editingAddress.fullName,
        phone: editingAddress.phone,
        addressLine1: editingAddress.addressLine1,
        addressLine2: editingAddress.addressLine2 || "",
        city: editingAddress.city,
        state: editingAddress.state || "",
        zip: editingAddress.zip,
        isDefault: editingAddress.isDefault,
      });
    } else {
      setForm({ ...emptyForm, fullName: user?.name || "", phone: user?.phone || "" });
    }
  }, [editingAddress, open, user]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Required";
    if (!form.phone.trim()) next.phone = "Required";
    if (!form.addressLine1.trim()) next.addressLine1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!form.zip.trim()) next.zip = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = editingAddress
        ? await api.put(`/account/addresses/${editingAddress._id}`, form)
        : await api.post("/account/addresses", form);
      toast.success(editingAddress ? "Address updated" : "Address saved");
      onSaved(data, !editingAddress);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form onSubmit={handleSubmit} className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">{editingAddress ? "Edit Address" : "Add New Address"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthInput label="Full Name" value={form.fullName} onChange={handleChange("fullName")} error={errors.fullName} />
            <AuthInput label="Phone" value={form.phone} onChange={handleChange("phone")} error={errors.phone} />
          </div>
          <AuthInput label="Address Line 1" value={form.addressLine1} onChange={handleChange("addressLine1")} error={errors.addressLine1} />
          <AuthInput label="Address Line 2 (optional)" value={form.addressLine2} onChange={handleChange("addressLine2")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <AuthInput label="City" value={form.city} onChange={handleChange("city")} error={errors.city} />
            <AuthInput label="State (optional)" value={form.state} onChange={handleChange("state")} />
            <AuthInput label="Zip Code" value={form.zip} onChange={handleChange("zip")} error={errors.zip} />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
            Set as default address
          </label>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {submitting ? "Saving..." : "Save Address"}
          </button>
        </div>
      </form>
    </div>
  );
}