import { useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import AuthInput from "../components/auth/AuthInput";
import StatusBadge from "../components/orders/StatusBadge";
import StatusTimeline from "../components/orders/StatusTimeline";
import TaxRow from "../components/orders/TaxRow";

export default function TrackOrder() {
  const [form, setForm] = useState({ orderId: "", email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState("");
  const [order, setOrder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!form.orderId.trim()) next.orderId = "Enter your order number";
    if (!form.email.trim()) next.email = "Enter the email used for the order";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setNotFound("");
    setOrder(null);
    try {
      const { data } = await api.post("/orders/track", {
        orderId: form.orderId.trim(),
        email: form.email.trim(),
      });
      setOrder(data);
    } catch (err) {
      setNotFound(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  let estimatedDate = null;
  if (order) {
    estimatedDate = new Date(order.createdAt);
    estimatedDate.setDate(estimatedDate.getDate() + (order.deliveryMethod === "express" ? 2 : 4));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <PackageSearch size={44} className="mx-auto text-primary" />
        <h1 className="mt-3 text-2xl font-bold text-ink">Track Your Order</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your order number (from your confirmation email, like #2D76A9F3) and the email you ordered with.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <AuthInput
          label="Order Number"
          placeholder="#2D76A9F3"
          value={form.orderId}
          onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          error={errors.orderId}
        />
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? "Searching..." : "Track Order"}
        </button>
        <p className="text-center text-xs text-muted">
          Have an account?{" "}
          <Link to="/account/orders" className="font-semibold text-primary hover:underline">
            See all your orders
          </Link>
        </p>
      </form>

      {notFound && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm text-danger ring-1 ring-red-200">{notFound}</p>
      )}

      {order && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-muted">
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {order.city && ` • Delivering to ${order.city}`}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-6">
              <StatusTimeline status={order.status} />
            </div>

            {order.trackingNumber && (
              <p className="mt-4 text-sm text-muted">
                Tracking Number: <span className="font-medium text-ink">{order.trackingNumber}</span>
              </p>
            )}
            {!["delivered", "cancelled", "returned"].includes(order.status) && estimatedDate && (
              <p className="mt-2 text-sm text-muted">
                Estimated delivery:{" "}
                <span className="font-medium text-ink">
                  {estimatedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </p>
            )}
            {order.status === "cancelled" && order.cancelReason && (
              <p className="mt-2 text-sm text-muted">
                Cancellation reason: <span className="text-ink">{order.cancelReason}</span>
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-sm font-semibold text-ink">Items</h3>
            <div className="mt-3 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-muted">
                      Qty: {item.quantity}
                      {item.size && ` • Size: ${item.size}`}
                      {item.color && ` • Color: ${item.color}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink">
                    Rs {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>Rs {order.itemsPrice.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>- Rs {order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{order.shippingPrice === 0 ? "Free" : `Rs ${order.shippingPrice}`}</span>
              </div>
              <TaxRow order={order} />
              <div className="flex justify-between pt-1 text-base font-bold text-ink">
                <span>Total</span>
                <span>Rs {order.totalPrice.toLocaleString()}</span>
              </div>
              <p className="pt-1 text-xs text-muted">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid by card"}
                {order.isRefunded && " • Refunded"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}