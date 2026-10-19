import { X } from "lucide-react";

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

// "Sky Blue" -> "skyblue" (jo CSS ke rang ka naam ho wahi dot mein nazar aata hai)
const cssColor = (name) => name.toLowerCase().replace(/\s+/g, "");

const chipClass = (active) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
    active ? "bg-primary text-white" : "bg-surface text-ink ring-1 ring-slate-200 hover:ring-primary"
  }`;

export default function FilterSidebar({
  categories,
  options,
  filters,
  onChange,
  onApply,
  onClear,
  open,
  onClose,
}) {
  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between lg:hidden">
        <h3 className="font-semibold text-ink">Filters</h3>
        <button onClick={onClose} aria-label="Close filters">
          <X size={22} className="text-muted" />
        </button>
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-ink">Category</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat._id} className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={filters.category === cat.slug}
                onChange={() => onChange({ ...filters, category: filters.category === cat.slug ? "" : cat.slug })}
                className="h-4 w-4 rounded accent-primary"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {options.brands.length > 0 && (
        <div>
          <h4 className="mb-3 font-semibold text-ink">Brand</h4>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {options.brands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => onChange({ ...filters, brands: toggleInList(filters.brands, brand) })}
                  className="h-4 w-4 rounded accent-primary"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-3 font-semibold text-ink">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
          />
          <span className="text-muted">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-ink">Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={filters.rating === String(r)}
                onChange={() => onChange({ ...filters, rating: filters.rating === String(r) ? "" : String(r) })}
                className="h-4 w-4 rounded accent-primary"
              />
              {r}★ & above
            </label>
          ))}
        </div>
      </div>

      {options.sizes.length > 0 && (
        <div>
          <h4 className="mb-3 font-semibold text-ink">Size</h4>
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...filters, sizes: toggleInList(filters.sizes, s) })}
                className={chipClass(filters.sizes.includes(s))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {options.colors.length > 0 && (
        <div>
          <h4 className="mb-3 font-semibold text-ink">Color</h4>
          <div className="flex flex-wrap gap-2">
            {options.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...filters, colors: toggleInList(filters.colors, c) })}
                className={chipClass(filters.colors.includes(c))}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-slate-300"
                  style={{ backgroundColor: cssColor(c) }}
                />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onApply}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          Apply Filters
        </button>
        <button
          onClick={onClear}
          className="rounded-lg bg-surface px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          Clear All
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: hamesha nazar aata hai */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">{content}</aside>

      {/* Mobile: slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}