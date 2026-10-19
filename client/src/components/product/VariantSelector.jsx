export default function VariantSelector({ label, options, selected, onSelect }) {
  if (!options || options.length === 0) return null;

  const isColor = label.toLowerCase() === "color";

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-ink">
        {label}
        {selected && <span className="ml-1 font-normal text-muted">: {selected}</span>}
      </h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              selected === opt
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-ink hover:border-primary"
            } ${isColor ? "min-w-16" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}