import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({ quantity, onChange, max }) {
  const decrease = () => onChange(Math.max(1, quantity - 1));
  const increase = () => onChange(Math.min(max, quantity + 1));

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg ring-1 ring-slate-200">
        <button
          onClick={decrease}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          className="p-2.5 text-ink transition hover:bg-surface disabled:opacity-40"
        >
          <Minus size={16} />
        </button>
        <span className="w-10 text-center text-sm font-semibold text-ink">{quantity}</span>
        <button
          onClick={increase}
          disabled={quantity >= max}
          aria-label="Increase quantity"
          className="p-2.5 text-ink transition hover:bg-surface disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>
      {max > 0 && max <= 5 && (
        <span className="text-sm text-warning">Only {max} left</span>
      )}
    </div>
  );
}