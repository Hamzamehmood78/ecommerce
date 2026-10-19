import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Bookmark } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatMoney } from "../../utils/currency";

export default function CartItemRow({ item }) {
  const { updateQuantity, removeItem, saveForLater } = useCart();
  const { product, quantity, size, color, itemId } = item;

  if (!product) return null;

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const lineTotal = price * quantity;

  return (
    <div className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <Link to={`/product/${product.slug}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {product.images?.[0] && (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/product/${product.slug}`} className="text-sm font-medium text-ink hover:text-primary">
              {product.name}
            </Link>
            {(size || color) && (
              <p className="mt-0.5 text-xs text-muted">
                {size && `Size: ${size}`} {size && color && "•"} {color && `Color: ${color}`}
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              onClick={() => saveForLater(itemId)}
              aria-label="Save for later"
              title="Save for later"
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-primary"
            >
              <Bookmark size={16} />
              <span className="hidden sm:inline">Save for later</span>
            </button>
            <button
              onClick={() => removeItem(itemId)}
              aria-label="Remove item"
              className="text-muted hover:text-danger"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-lg ring-1 ring-slate-200">
            <button
              onClick={() => updateQuantity(itemId, Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1.5 text-ink transition hover:bg-surface disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => updateQuantity(itemId, quantity + 1)}
              disabled={product.stock ? quantity >= product.stock : false}
              className="p-1.5 text-ink transition hover:bg-surface disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="font-semibold text-ink">{formatMoney(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}