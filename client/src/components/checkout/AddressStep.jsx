import { Pencil, Trash2, Plus, MapPin } from "lucide-react";

export default function AddressStep({
  addresses,
  loading,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onNext,
}) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Shipping Address</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/30 hover:bg-primary/5"
        >
          <Plus size={16} /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-xl bg-surface px-6 py-10 text-center">
          <MapPin size={36} className="text-muted" />
          <p className="mt-3 font-medium text-ink">No saved addresses yet</p>
          <p className="mt-1 text-sm text-muted">Add an address to continue. It will be saved to your account.</p>
          <button
            onClick={onAdd}
            className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Add New Address
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {addresses.map((a) => (
            <label
              key={a._id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                selectedId === a._id ? "border-primary bg-primary/5" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedId === a._id}
                onChange={() => onSelect(a._id)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-ink">
                  {a.fullName}
                  {a.isDefault && (
                    <span className="ml-2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold text-white">Default</span>
                  )}
                </p>
                <p className="text-muted">{a.phone}</p>
                <p className="text-muted">
                  {a.addressLine1}{a.addressLine2 && `, ${a.addressLine2}`}, {a.city}
                  {a.state && `, ${a.state}`} - {a.zip}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <button type="button" onClick={() => onEdit(a)} aria-label="Edit address" className="text-muted hover:text-primary">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => onDelete(a)} aria-label="Delete address" className="text-muted hover:text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </label>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!selectedId}
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
      >
        Continue to Delivery
      </button>
    </div>
  );
}