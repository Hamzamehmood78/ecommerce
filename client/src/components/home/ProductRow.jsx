import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <div className="aspect-square rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/3 rounded bg-slate-200" />
    </div>
  );
}

export default function ProductRow({ title, products, loading, viewAllLink }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>

      {!loading && products.length === 0 && (
        <p className="text-sm text-muted">No products to show yet.</p>
      )}
    </section>
  );
}