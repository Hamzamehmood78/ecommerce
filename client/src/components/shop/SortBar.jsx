import { LayoutGrid, List } from "lucide-react";

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
];

export default function SortBar({
  total,
  sort,
  onSortChange,
  view,
  onViewChange,
  onOpenFilters,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenFilters}
          className="rounded-lg bg-surface px-3 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 lg:hidden"
        >
          Filters
        </button>
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{total}</span> products found
        </p>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border-0 bg-surface px-3 py-2 text-sm text-ink ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg bg-surface p-1 ring-1 ring-slate-200">
          <button
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
            className={`rounded-md p-1.5 ${view === "grid" ? "bg-white text-primary shadow-sm" : "text-muted"}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => onViewChange("list")}
            aria-label="List view"
            className={`rounded-md p-1.5 ${view === "list" ? "bg-white text-primary shadow-sm" : "text-muted"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}