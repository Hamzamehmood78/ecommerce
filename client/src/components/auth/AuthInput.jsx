export default function AuthInput({ label, error, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        {...props}
        className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 transition ${
          error
            ? "ring-danger focus:ring-2 focus:ring-danger"
            : "ring-slate-200 focus:ring-2 focus:ring-primary"
        }`}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}