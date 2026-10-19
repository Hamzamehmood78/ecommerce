import ProductCard from "../home/ProductCard";

export default function RelatedProducts({ products, loading }) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold text-ink">You May Also Like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-slate-100 p-3">
                <div className="aspect-square rounded-lg bg-slate-200" />
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
              </div>
            ))
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}