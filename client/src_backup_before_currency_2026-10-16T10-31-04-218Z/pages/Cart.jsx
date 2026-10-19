import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import CartItemRow from "../components/cart/CartItemRow";
import OrderSummary from "../components/cart/OrderSummary";
import SavedItems from "../components/cart/SavedItems";

export default function Cart() {
  const { items, savedItems, loading } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  // Na cart mein kuch, na shelf mein
  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <ShoppingCart size={48} className="text-muted" />
        <h1 className="mt-4 text-2xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-muted">Looks like you haven't added anything yet.</p>
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl bg-surface px-6 py-12 text-center">
          <ShoppingCart size={40} className="text-muted" />
          <p className="mt-3 text-lg font-semibold text-ink">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted">Move something back from your saved items, or keep shopping.</p>
          <Link
            to="/shop"
            className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <CartItemRow key={item.itemId} item={item} />
            ))}
          </div>

          <div>
            <OrderSummary />
          </div>
        </div>
      )}

      <SavedItems />
    </div>
  );
}