import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="rounded-lg p-2 text-muted transition hover:bg-surface disabled:opacity-40"
      >
        <ChevronLeft size={18} />
      </button>

      {pageNumbers.map((n) => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
            n === page
              ? "bg-primary text-white"
              : "text-ink hover:bg-surface"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        aria-label="Next page"
        className="rounded-lg p-2 text-muted transition hover:bg-surface disabled:opacity-40"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}