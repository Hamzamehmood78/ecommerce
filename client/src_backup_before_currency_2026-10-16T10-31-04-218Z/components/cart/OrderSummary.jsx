import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import useTaxSettings, { calculateTax } from "../../hooks/useTaxSettings";

export default function OrderSummary({ showCheckoutButton = true }) {
  const { user } = useAuth();
  const { subtotal, itemCount, coupon, setCoupon, removeCoupon, discountAmount: cartDiscount } = useCart();
  const taxSettings = useTaxSettings();
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [shippingConfig, setShippingConfig] = useState({ standard: 200, freeShippingThreshold: 3000 });

  // Coupon sirf account wale customer ke liye
  const activeCoupon = user ? coupon : null;
  const discountAmount = user ? cartDiscount : 0;

  useEffect(() => {
    api
      .get("/orders/shipping-rates")
      .then(({ data }) => {
        setShippingConfig({
          standard: data.rates?.standard?.price ?? 200,
          freeShippingThreshold: data.freeShippingThreshold ?? 3000,
        });
      })
      .catch(() => {});
  }, []);

  // Free shipping aur tax dono discount ke baad ki raqam par
  const taxable = Math.max(subtotal - discountAmount, 0);
  const shipping = taxable > shippingConfig.freeShippingThreshold || subtotal === 0 ? 0 : shippingConfig.standard;
  const taxPrice = calculateTax(taxable, taxSettings);
  const total = taxable + shipping + taxPrice;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setApplying(true);
    try {
      const { data } = await api.post("/coupons/validate", { code: code.trim() });
      setCoupon(data);
      toast.success(`Coupon applied: Rs ${data.discountAmount.toLocaleString()} off`);
      setCode("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-ink">Order Summary</h3>

      {!user ? (
        <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-sm text-muted">
          Have a coupon code?{" "}
          <Link to="/login" state={{ from: "/cart" }} className="font-semibold text-primary hover:underline">
            Log in
          </Link>{" "}
          to use it.
        </p>
      ) : activeCoupon ? (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 ring-1 ring-green-200">
          <span className="flex items-center gap-1.5 text-sm font-medium text-success">
            <Tag size={14} /> {activeCoupon.code}
          </span>
          <button onClick={removeCoupon} aria-label="Remove coupon" className="text-success hover:text-danger">
            <X size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="mt-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code"
            className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={applying}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {applying ? "..." : "Apply"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal ({itemCount} items)</span>
          <span>Rs {subtotal.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>- Rs {discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-muted">
          <span>Shipping (estimated)</span>
          <span>{shipping === 0 ? "Free" : `Rs ${shipping}`}</span>
        </div>
        {taxPrice > 0 && (
          <div className="flex justify-between text-muted">
            <span>
              {taxSettings.label} ({taxSettings.rate}%)
            </span>
            <span>Rs {taxPrice.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-slate-200 pt-4">
        <span className="font-semibold text-ink">Grand Total</span>
        <span className="text-lg font-bold text-ink">Rs {total.toLocaleString()}</span>
      </div>

      {showCheckoutButton && (
        <>
          <Link
            to="/checkout"
            className={`mt-5 block rounded-lg py-3 text-center font-semibold text-white transition ${
              itemCount === 0 ? "pointer-events-none bg-slate-300" : "bg-accent hover:bg-accent-dark"
            }`}
          >
            {user ? "Proceed to Checkout" : "Checkout"}
          </Link>
          {!user && (
            <p className="mt-2 text-center text-xs text-muted">No account needed. You can check out as a guest.</p>
          )}
          <Link to="/shop" className="mt-3 block text-center text-sm font-medium text-primary hover:underline">
            Continue Shopping
          </Link>
        </>
      )}
    </div>
  );
}