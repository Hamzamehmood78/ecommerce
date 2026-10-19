import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Eye } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import QuickViewModal from "../product/QuickViewModal";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const inWishlist = isInWishlist(product._id);

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const isOutOfStock = product.status === "out_of_stock" || product.stock === 0;
  const hasVariants = product.sizes?.length > 0 || product.colors?.length > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    // Size/color wale product mein customer ko khud chunna chahiye
    if (hasVariants) {
      setQuickViewOpen(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    setQuickViewOpen(true);
  };

  return (
    <>
      <Link
        to={`/product/${product.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
      >
        <button
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          className={`absolute right-5 top-5 z-10 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:text-danger ${
            inWishlist ? "text-danger" : "text-muted"
          }`}
        >
          <Heart size={16} className={inWishlist ? "fill-danger" : ""} />
        </button>

        {hasDiscount && (
          <span className="absolute left-5 top-5 z-10 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}

        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted">No image</div>
          )}

          <button
            onClick={handleQuickView}
            className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/95 py-1.5 text-xs font-semibold text-ink shadow transition md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            <Eye size={14} /> Quick View
          </button>
        </div>

        <h3 className="mt-3 line-clamp-1 text-sm font-medium text-ink">{product.name}</h3>

        {product.numReviews > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Star size={14} className="fill-warning text-warning" />
            {product.rating.toFixed(1)} ({product.numReviews})
          </div>
        )}

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
            onClick={handleAddToCart}
            className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            Add to Cart
          </button>
        )}
      </Link>

      <QuickViewModal product={product} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </>
  );
}