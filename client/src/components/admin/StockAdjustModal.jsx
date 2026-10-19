import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../auth/AuthInput";

const quickReasons = {
  add: ["New stock arrived", "Customer return restocked", "Stock count correction"],
  remove: ["Damaged units removed", "Lost or stolen", "Stock count correction"],
};

export default function StockAdjustModal({ open, onClose, onSaved, product }) {
  const [mode, setMode] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode("add");
    setQuantity("");
    setReason("");
  }, [product, open]);

  if (!open || !product) return null;

  const qty = Number(quantity);
  const validQty = Number.isInteger(qty) && qty > 0;
  const newStock = validQty ? product.stock + (mode === "add" ? qty : -qty) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validQty) {
      toast.error("Enter a whole number greater than 0");
      return;
    }
    if (mode === "remove" && qty > product.stock) {
      toast.error(`Cannot remove ${qty}. Only ${product.stock} in stock`);
      return;
    }
    if (!reason.trim()) {
      toast.error("Please give a reason for this change");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/inventory/${product._id}/adjust`, {
        change: mode === "add" ? qty : -qty,
        reason,
      });
      toast.success("Stock updated");
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

      <form onSubmit={handleSubmit} className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">Adjust Stock</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="rounded-lg bg-surface p-3">
            <p className="font-medium text-ink">{product.name}</p>
            <p className="text-sm text-muted">Current stock: {product.stock}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                mode === "add" ? "bg-success text-white" : "bg-surface text-muted ring-1 ring-slate-200"
              }`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => setMode("remove")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                mode === "remove" ? "bg-danger text-white" : "bg-surface text-muted ring-1 ring-slate-200"
              }`}
            >
              − Remove Stock
            </button>
          </div>

          <AuthInput
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <div>
            <AuthInput
              label="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New stock arrived"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickReasons[mode].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="rounded-md bg-surface px-2 py-1 text-xs text-muted ring-1 ring-slate-200 hover:text-primary"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {newStock !== null && (
            <p className={`text-sm font-medium ${newStock < 0 ? "text-danger" : "text-ink"}`}>
              New stock will be: {newStock}
            </p>
          )}
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