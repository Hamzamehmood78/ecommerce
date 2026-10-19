import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function SavedItems() {
  const { savedItems, moveToCart, removeSaved } = useCart();

  if (savedItems.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Bookmark size={18} className="text-primary" />
        Saved for Later ({savedItems.length})
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {savedItems.map((item) => {
          const { product, quantity, size, color, itemId } = item;
          const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
          const price = hasDiscount ? product.discountPrice : product.price;
          const outOfStock = product.status === "out_of_stock" || product.stock === 0;

          return (
            <div key={itemId} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <Link
                to={`/product/${product.slug}`}
                className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
              >
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link
                    to={`/product/${product.slug}`}
                    className="line-clamp-1 text-sm font-medium text-ink hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted">
                    Qty: {quantity}
                    {size && ` • Size: ${size}`}
                    {color && ` • Color: ${color}`}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    Rs {price.toLocaleString()}
                    {hasDiscount && (
                      <span className="ml-1.5 text-xs font-normal text-muted line-through">
                        Rs {product.price.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {outOfStock ? (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">
                      Out of stock
                    </span>
                  ) : (
                    <button
                      onClick={() => moveToCart(itemId)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
                    >
                      Move to Cart
                    </button>
                  )}
                  <button
                    onClick={() => removeSaved(itemId)}
                    className="text-xs font-medium text-muted hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}