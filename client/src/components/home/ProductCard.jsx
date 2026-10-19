

import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Eye } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import QuickViewModal from "../product/QuickViewModal";
import { formatMoney } from "../../utils/currency";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const inWishlist = isInWishlist(product._id);

  const hasDiscount =
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const finalPrice = hasDiscount
    ? product.discountPrice
    : product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100
      )
    : 0;

  const isOutOfStock =
    product.status === "out_of_stock" || product.stock === 0;

  const hasVariants =
    product.sizes?.length > 0 || product.colors?.length > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasVariants) {
      setQuickViewOpen(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <Link
        to={`/product/${product.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-xl
          border border-slate-200 bg-white p-3 shadow-sm
          transition-all duration-300 ease-out
          hover:-translate-y-2 hover:border-orange-200
          hover:shadow-xl hover:shadow-slate-200/70
          motion-reduce:transform-none motion-reduce:transition-none"
      >
        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            inWishlist ? "Remove from wishlist" : "Add to wishlist"
          }
          className={`absolute right-5 top-5 z-20 rounded-full
            bg-white/95 p-2 shadow-md
            transition-all duration-300
            hover:scale-110 hover:shadow-lg
            active:scale-90
            ${
              inWishlist
                ? "text-danger"
                : "text-muted hover:text-danger"
            }`}
        >
          <Heart
            size={17}
            className={`transition-transform duration-300 ${
              inWishlist ? "scale-110 fill-danger" : ""
            }`}
          />
        </button>

        {/* Discount badge */}
        {hasDiscount && (
          <span
            className="absolute left-5 top-5 z-10 rounded-md
              bg-accent px-2 py-1 text-xs font-semibold text-white
              transition-transform duration-300
              group-hover:scale-105"
          >
            -{discountPercent}%
          </span>
        )}

        {/* Product image */}
        <div className="relative aspect-square overflow-hidden rounded-lg  bg-slate-100">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover
                transition-transform duration-500 ease-out
                group-hover:scale-110
                motion-reduce:transform-none
                motion-reduce:transition-none"
                
            />
          ) : 
          (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted">
              No image
            </div>
          )}

          {/* Image overlay */}
          <div
            className="pointer-events-none absolute inset-0
              bg-black/0 transition-colors duration-300
              group-hover:bg-black/5"
          />

          {/* Quick View */}
          <button
            type="button"
            onClick={handleQuickView}
            className="absolute inset-x-2 bottom-2
              flex items-center justify-center gap-1.5
              rounded-lg bg-white/95 py-2 text-xs font-semibold text-ink
              shadow-md transition-all duration-300
              hover:bg-accent hover:text-white
              md:translate-y-3 md:opacity-0
              md:group-hover:translate-y-0
              md:group-hover:opacity-100
              focus-visible:translate-y-0
              focus-visible:opacity-100"
          >
            <Eye size={14} />
            Quick View
          </button>
        </div>

        {/* Product name */}
        <h3
          className="mt-3 line-clamp-1 text-sm font-medium text-ink
            transition-colors duration-300
            group-hover:text-orange-600"
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.numReviews > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Star size={14} className="fill-warning text-warning" />
            {Number(product.rating || 0).toFixed(1)} ({product.numReviews})
          </div>
        )}

        {/* Price */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">
            {formatMoney(finalPrice)}
          </span>

          {hasDiscount && (
            <span className="text-sm text-muted line-through">
              {formatMoney(product.price)}
            </span>
          )}
        </div>

        {/* Cart button / stock status */}
        {isOutOfStock ? (
          <span className="mt-3 rounded-lg bg-slate-100 px-3 py-2
            text-center text-sm font-medium text-muted">
            Out of Stock
          </span>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-3 rounded-lg bg-accent px-3 py-2
              text-sm font-semibold text-white
              transition-all duration-300
              hover:bg-accent-dark hover:shadow-lg
              hover:shadow-orange-200/60
              active:scale-[0.98]
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-orange-400
              focus-visible:ring-offset-2"
          >
            Add to Cart
          </button>
        )}
      </Link>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}














