import { useEffect, useState } from "react";

// Wajah (reason) poochne wala chhota dialog: cancel, return reject, return request, waghera
export default function ReasonDialog({
  open,
  title,
  message,
  label = "Reason",
  placeholder = "",
  confirmLabel = "Confirm",
  confirmingLabel = "Saving...",
  minLength = 1,
  destructive = true,
  submitting = false,
  onConfirm,
  onCancel,
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open) return null;

  const valid = text.trim().length >= minLength;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="font-semibold text-ink">{title}</h3>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}

        <label className="mt-4 block text-sm font-medium text-ink">{label}</label>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
        />
        {minLength > 1 && (
          <p className="mt-1 text-xs text-muted">At least {minLength} characters.</p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface"
          >
            Back
          </button>
          <button
            onClick={() => onConfirm(text.trim())}
            disabled={!valid || submitting}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              destructive ? "bg-danger hover:bg-red-700" : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {submitting ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}