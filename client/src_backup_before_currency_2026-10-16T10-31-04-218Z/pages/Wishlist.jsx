import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

export default function Wishlist() {
  const { products, loading, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = (product) => {
    addItem(product, 1);
    removeFromWishlist(product._id);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <Heart size={48} className="text-muted" />
        <h1 className="mt-4 text-2xl font-semibold text-ink">Your wishlist is empty</h1>
        <p className="mt-2 text-muted">Save items you love for later.</p>
        <Link
          to="/shop"
          className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-dark"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">My Wishlist ({products.length})</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
          const finalPrice = hasDiscount ? product.discountPrice : product.price;
          const isOutOfStock = product.status === "out_of_stock" || product.stock === 0;

          return (
            <div key={product._id} className="relative flex flex-col overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <button
                onClick={() => removeFromWishlist(product._id)}
                aria-label="Remove from wishlist"
                className="absolute right-5 top-5 z-10 rounded-full bg-white/90 p-1.5 text-muted shadow-sm transition hover:text-danger"
              >
                <Trash2 size={16} />
              </button>

              <Link to={`/product/${product.slug}`} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                )}
              </Link>

              <Link to={`/product/${product.slug}`} className="mt-3 line-clamp-1 text-sm font-medium text-ink hover:text-primary">
                {product.name}
              </Link>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-ink">Rs {finalPrice.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="text-sm text-muted line-through">Rs {product.price.toLocaleString()}</span>
                )}
              </div>

              {isOutOfStock ? (
                <span className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-muted">
                  Out of Stock
                </span>
              ) : (
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
                >
                  <ShoppingCart size={16} /> Move to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}