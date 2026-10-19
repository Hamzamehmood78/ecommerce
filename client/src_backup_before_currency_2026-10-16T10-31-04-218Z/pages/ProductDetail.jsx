import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import { useCart } from "../context/CartContext";
import { useState as useStateAlias } from "react";
import { useWishlist } from "../context/WishlistContext";
import ImageGallery from "../components/product/ImageGallery";
import VariantSelector from "../components/product/VariantSelector";
import QuantitySelector from "../components/product/QuantitySelector";
import ProductTabs from "../components/product/ProductTabs";
import DeliveryCheck from "../components/product/DeliveryCheck";
import ShareButtons from "../components/product/ShareButtons";
import RelatedProducts from "../components/product/RelatedProducts";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
    const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    setQuantity(1);
    setSize("");
    setColor("");

    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        if (ignore) return;
        setProduct(data);
        if (data.sizes?.length) setSize(data.sizes[0]);
        if (data.colors?.length) setColor(data.colors[0]);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    let ignore = false;
    setRelatedLoading(true);

    api
      .get("/products", { params: { category: product.category?.slug, limit: 4 } })
      .then(({ data }) => {
        if (ignore) return;
        setRelated(data.products.filter((p) => p._id !== product._id));
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setRelatedLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-7 w-3/4 rounded bg-slate-200" />
            <div className="h-5 w-1/3 rounded bg-slate-200" />
            <div className="h-10 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">
          {error || "Product not found"}
        </p>
        <Link to="/shop" className="mt-4 inline-block text-primary hover:underline">
          Back to Shop
        </Link>
      </div>
    );
  }

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const isOutOfStock = product.status === "out_of_stock" || product.stock === 0;

  const handleAddToCart = () => {
    addItem(product, quantity, size, color);
  };
  const handleNotifyMe = async (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    try {
      await api.post(`/products/${product._id}/notify-me`, { email: notifyEmail });
      toast.success("We'll email you when it's back in stock");
      setNotifySubmitted(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
    const handleBuyNow = () => {
    addItem(product, quantity, size, color);
    navigate("/cart");
  };

  const handleWishlist = () => {
    toggleWishlist(product);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-1.5">/</span>
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        {product.category && (
          <>
            <span className="mx-1.5">/</span>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-primary">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images} name={product.name} />

        <div>
          <h1 className="text-2xl font-bold text-ink">{product.name}</h1>

          {product.numReviews > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Star size={16} className="fill-warning text-warning" />
              <span className="text-sm font-medium text-ink">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted">({product.numReviews} reviews)</span>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-ink">
              Rs {finalPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted line-through">
                  Rs {product.price.toLocaleString()}
                </span>
                <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-semibold text-white">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          <div className="mt-3">
            {isOutOfStock ? (
              <span className="text-sm font-medium text-danger">Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-sm font-medium text-warning">
                Only {product.stock} left in stock
              </span>
            ) : (
              <span className="text-sm font-medium text-success">In Stock</span>
            )}
          </div>

                  <div className="mt-6 space-y-5">
            <VariantSelector label="Size" options={product.sizes} selected={size} onSelect={setSize} />
            <VariantSelector label="Color" options={product.colors} selected={color} onSelect={setColor} />

            {!isOutOfStock && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Quantity</h4>
                <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
              </div>
            )}

            {isOutOfStock && !notifySubmitted && (
              <form onSubmit={handleNotifyMe} className="rounded-xl bg-surface p-4">
                <h4 className="text-sm font-semibold text-ink">Notify Me When Available</h4>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-lg bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
                  />
                  <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                    Notify Me
                  </button>
                </div>
              </form>
            )}

            {isOutOfStock && notifySubmitted && (
              <p className="rounded-xl bg-green-50 p-4 text-sm text-success ring-1 ring-green-200">
                You're on the list! We'll email you when this is back in stock.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>
            <button
              onClick={handleWishlist}
              aria-label="Add to wishlist"
              className={`flex items-center justify-center rounded-lg px-4 py-3 ring-1 ring-slate-200 transition hover:text-danger ${
                isInWishlist(product._id) ? "text-danger" : "text-muted"
              }`}
            >
              <Heart size={20} className={isInWishlist(product._id) ? "fill-danger" : ""} />
            </button>
          </div>

          <div className="mt-6">
            <ShareButtons productName={product.name} />
          </div>

          <div className="mt-6">
            <DeliveryCheck />
          </div>
        </div>
      </div>

      <ProductTabs product={product} />

      <RelatedProducts products={related} loading={relatedLoading} />
    </div>
  );
}