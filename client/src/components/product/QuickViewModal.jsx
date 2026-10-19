import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Star } from "lucide-react";
import { useCart } from "../../context/CartContext";
import ImageGallery from "./ImageGallery";
import VariantSelector from "./VariantSelector";
import QuantitySelector from "./QuantitySelector";
import { formatMoney } from "../../utils/currency";

export default function QuickViewModal({ product, open, onClose }) {
  const { addItem } = useCart();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Har dafa kholne par default pehla size/color
  useEffect(() => {
    if (open) {
      setSize(product.sizes?.[0] || "");
      setColor(product.colors?.[0] || "");
      setQuantity(1);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const isOutOfStock = product.status === "out_of_stock" || product.stock === 0;

  const handleAdd = async () => {
    setAdding(true);
    await addItem(product, quantity, size, color);
    setAdding(false);
    onClose();
  };

  // Body mein render hota hai, taake card ke andar ki kisi cheez se na phanse
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-1.5 text-muted shadow ring-1 ring-slate-200 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          <ImageGallery images={product.images} name={product.name} />

          <div>
            <h2 className="pr-8 text-xl font-bold text-ink">{product.name}</h2>

            {product.numReviews > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <Star size={15} className="fill-warning text-warning" />
                <span className="text-sm font-medium text-ink">{product.rating.toFixed(1)}</span>
                <span className="text-sm text-muted">({product.numReviews} reviews)</span>
              </div>
            )}

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink">{formatMoney(finalPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted line-through">{formatMoney(product.price)}</span>
                  <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-sm font-medium">
              {isOutOfStock ? (
                <span className="text-danger">Out of Stock</span>
              ) : product.stock <= 5 ? (
                <span className="text-warning">Only {product.stock} left in stock</span>
              ) : (
                <span className="text-success">In Stock</span>
              )}
            </p>

            <p className="mt-3 line-clamp-3 text-sm text-muted">{product.description}</p>

            <div className="mt-4 space-y-4">
              <VariantSelector label="Size" options={product.sizes} selected={size} onSelect={setSize} />
              <VariantSelector label="Color" options={product.colors} selected={color} onSelect={setColor} />
              {!isOutOfStock && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-ink">Quantity</h4>
                  <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
                </div>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock || adding}
              className="mt-5 w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isOutOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
            </button>

            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}