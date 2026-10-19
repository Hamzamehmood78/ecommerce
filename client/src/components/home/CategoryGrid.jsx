import { Link } from "react-router-dom";

export default function CategoryGrid({ categories, loading }) {
  if (!loading && categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-4 text-xl font-bold text-ink">Shop by Category</h2>
      <div className="flex gap-5 overflow-x-auto pb-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-shrink-0 flex-col items-center gap-2">
                <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200 sm:h-24 sm:w-24" />
                <div className="h-3 w-14 animate-pulse rounded bg-slate-200" />
              </div>
            ))
          : categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat.slug}`}
                className="flex flex-shrink-0 flex-col items-center gap-2"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full bg-surface ring-1 ring-slate-200 transition group-hover:ring-primary sm:h-24 sm:w-24">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                      {cat.name[0]}
                    </div>
                  )}
                </div>
                <span className="max-w-20 truncate text-sm font-medium text-ink">
                  {cat.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}