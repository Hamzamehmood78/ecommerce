import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
export default function ProductListItem({ product }) {
      const { addItem } = useCart();
        const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product._id);
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const isOutOfStock = product.status === "out_of_stock" || product.stock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem(product, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
    >
      <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-36 sm:w-36">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-ink">{product.name}</h3>
          <button
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            className={`flex-shrink-0 hover:text-danger ${inWishlist ? "text-danger" : "text-muted"}`}
          >
            <Heart size={18} className={inWishlist ? "fill-danger" : ""} />
          </button>
        </div>

        {product.numReviews > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Star size={14} className="fill-warning text-warning" />
            {product.rating.toFixed(1)} ({product.numReviews})
          </div>
        )}

        <p className="mt-2 line-clamp-2 hidden text-sm text-muted sm:block">
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ink">
              Rs {finalPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted line-through">
                Rs {product.price.toLocaleString()}
              </span>
            )}
          </div>

          {isOutOfStock ? (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-muted">
              Out of Stock
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dark"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}