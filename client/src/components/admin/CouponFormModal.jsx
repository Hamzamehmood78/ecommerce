import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../auth/AuthInput";

const emptyForm = {
  code: "", discountType: "percentage", discountValue: "", minOrderValue: "",
  usageLimit: "", usageLimitPerUser: "1", expiryDate: "", applicableCategories: [],
};

export default function CouponFormModal({ open, onClose, onSaved, editingCoupon, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCoupon) {
      setForm({
        code: editingCoupon.code,
        discountType: editingCoupon.discountType,
        discountValue: editingCoupon.discountValue,
        minOrderValue: editingCoupon.minOrderValue || "",
        usageLimit: editingCoupon.usageLimit ?? "",
        usageLimitPerUser: editingCoupon.usageLimitPerUser,
        expiryDate: editingCoupon.expiryDate?.slice(0, 10) || "",
        applicableCategories: (editingCoupon.applicableCategories || []).map((c) => c._id || c),
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingCoupon, open]);

  if (!open) return null;

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      applicableCategories: f.applicableCategories.includes(id)
        ? f.applicableCategories.filter((c) => c !== id)
        : [...f.applicableCategories, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue || !form.expiryDate) {
      toast.error("Code, discount value and expiry date are required");
      return;
    }

    const payload = {
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usageLimitPerUser: Number(form.usageLimitPerUser) || 1,
      expiryDate: form.expiryDate,
      applicableCategories: form.applicableCategories,
    };

    setSubmitting(true);
    try {
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon._id}`, payload);
        toast.success("Coupon updated");
      } else {
        await api.post("/coupons", payload);
        toast.success("Coupon created");
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
        noValidate
        className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">{editingCoupon ? "Edit Coupon" : "Add Coupon"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <AuthInput
            label="Coupon Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="SAVE20"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (Rs)</option>
              </select>
            </div>
            <AuthInput
              label={form.discountType === "percentage" ? "Discount %" : "Discount Amount"}
              type="number"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AuthInput
              label="Min Order Value (optional)"
              type="number"
              value={form.minOrderValue}
              onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            />
            <AuthInput
              label="Expiry Date"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AuthInput
              label="Total Usage Limit (optional)"
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="Unlimited"
            />
            <AuthInput
              label="Per-Customer Limit"
              type="number"
              value={form.usageLimitPerUser}
              onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Applicable Categories (optional — leave empty for all)
            </label>
            <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-lg bg-surface p-3">
              {categories.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.applicableCategories.includes(cat._id)}
                    onChange={() => toggleCategory(cat._id)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
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