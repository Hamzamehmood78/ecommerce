import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function MiniCart() {
  const { items, itemCount, subtotal, miniCartOpen, setMiniCartOpen, updateQuantity, removeItem } = useCart();
  const { pathname } = useLocation();

  // Cart/Checkout page par mini-cart ki zaroorat nahi
  const onCartPage = pathname === "/cart" || pathname.startsWith("/checkout");
  const isOpen = miniCartOpen && !onCartPage;

  // Page badalte hi band
  useEffect(() => {
    setMiniCartOpen(false);
  }, [pathname, setMiniCartOpen]);

  // Escape se band
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && setMiniCartOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, setMiniCartOpen]);

  const close = () => setMiniCartOpen(false);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-ink">
            Your Cart <span className="font-normal text-muted">({itemCount})</span>
          </h2>
          <button onClick={close} aria-label="Close cart" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingCart size={40} className="text-muted" />
            <p className="mt-3 font-medium text-ink">Your cart is empty</p>
            <Link
              to="/shop"
              onClick={close}
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {items.map((item) => {
                const { product, quantity, size, color, itemId } = item;
                const price = product.discountPrice > 0 ? product.discountPrice : product.price;
                return (
                  <div key={itemId} className="flex gap-3">
                    <Link
                      to={`/product/${product.slug}`}
                      onClick={close}
                      className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
                    >
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${product.slug}`}
                          onClick={close}
                          className="line-clamp-1 text-sm font-medium text-ink hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(itemId)}
                          aria-label="Remove item"
                          className="flex-shrink-0 text-muted hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {(size || color) && (
                        <p className="text-xs text-muted">
                          {size && `Size: ${size}`} {size && color && "•"} {color && `Color: ${color}`}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center rounded-md ring-1 ring-slate-200">
                          <button
                            onClick={() => updateQuantity(itemId, Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                            className="p-1 text-ink hover:bg-surface disabled:opacity-40"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemId, quantity + 1)}
                            disabled={product.stock ? quantity >= product.stock : false}
                            aria-label="Increase quantity"
                            className="p-1 text-ink hover:bg-surface disabled:opacity-40"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          Rs {(price * quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-lg font-bold text-ink">Rs {subtotal.toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Shipping and discounts are calculated at checkout.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to="/cart"
                  onClick={close}
                  className="rounded-lg py-2.5 text-center text-sm font-semibold text-ink ring-1 ring-slate-200 hover:bg-surface"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={close}
                  className="rounded-lg bg-accent py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-dark"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}