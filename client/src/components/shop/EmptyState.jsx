import { PackageSearch } from "lucide-react";

export default function EmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface px-6 py-16 text-center">
      <PackageSearch size={48} className="text-muted" />
      <h3 className="mt-4 text-lg font-semibold text-ink">No products found</h3>
      <p className="mt-1 text-sm text-muted">
        Try adjusting your filters or search term.
      </p>
      <button
        onClick={onClear}
        className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
      >
        Clear Filters
      </button>
    </div>
  );
}