import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Printer, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import TaxRow from "../components/orders/TaxRow";

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (user) {
      api
        .get(`/orders/${id}`)
        .then(({ data }) => setOrder(data))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
      return;
    }

    // Guest: order checkout ke waqt isi browser mein yaad rakha gaya tha
    try {
      const stored = JSON.parse(sessionStorage.getItem("guestOrder"));
      if (stored?.order?._id === id) {
        setOrder(stored.order);
        setGuestEmail(stored.email);
      } else {
        setError("We couldn't show this order here. Check your email, or use Track Order.");
      }
    } catch {
      setError("We couldn't show this order here. Check your email, or use Track Order.");
    }
    setLoading(false);
  }, [id, user]);

  // Guest ke liye "account banao": email par password set karne ka link
  const handleCreateAccount = async () => {
    setSendingLink(true);
    try {
      await api.post("/auth/forgot-password", { email: guestEmail });
      setLinkSent(true);
      toast.success("We've emailed you a link to set your password.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingLink(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-2xl animate-pulse px-4 py-16"><div className="h-64 rounded-xl bg-slate-100" /></div>;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error || "Order not found"}</p>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Link to="/track-order" className="text-primary hover:underline">Track Order</Link>
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const estimatedDays = order.deliveryMethod === "express" ? 2 : 4;
  const estimatedDate = new Date(order.createdAt);
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  const isGuest = !user;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 size={56} className="text-success" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Order Placed Successfully!</h1>
        <p className="mt-1 text-muted">
          Thank you for shopping with us.
          {isGuest && guestEmail && ` A confirmation has been sent to ${guestEmail}.`}
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs text-muted">Order ID</p>
            <p className="font-mono text-sm font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Estimated Delivery</p>
            <p className="text-sm font-semibold text-ink">
              {estimatedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-muted">Qty: {item.quantity}</p>
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
              <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
              <span>- Rs {order.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span>{order.shippingPrice === 0 ? "Free" : `Rs ${order.shippingPrice}`}</span>
          </div>
          <TaxRow order={order} />
          <div className="flex justify-between pt-1 text-base font-bold text-ink">
            <span>{order.paymentMethod === "cod" ? "Total (pay on delivery)" : "Total Paid"}</span>
            <span>Rs {order.totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-surface px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          <Printer size={16} /> Print / Download Invoice
        </button>
      </div>

      {isGuest && guestEmail && (
        <div className="mt-6 rounded-2xl bg-primary/5 p-5 ring-1 ring-primary/20">
          <div className="flex items-start gap-3">
            <UserPlus size={22} className="mt-0.5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-ink">Create an account (optional)</h3>
              <p className="mt-1 text-sm text-muted">
                Track your orders and check out faster next time. We'll email a link to{" "}
                <span className="font-medium text-ink">{guestEmail}</span> where you choose a password. This order
                will be added to your account.
              </p>
              {linkSent ? (
                <p className="mt-3 text-sm font-medium text-success">Link sent. Please check your email.</p>
              ) : (
                <button
                  onClick={handleCreateAccount}
                  disabled={sendingLink}
                  className="mt-3 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {sendingLink ? "Sending..." : "Email me the link"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {isGuest ? (
          <Link
            to="/track-order"
            className="flex-1 rounded-lg bg-primary px-6 py-3 text-center font-semibold text-white transition hover:bg-primary-dark"
          >
            Track Order
          </Link>
        ) : (
          <Link
            to="/account/orders"
            className="flex-1 rounded-lg bg-primary px-6 py-3 text-center font-semibold text-white transition hover:bg-primary-dark"
          >
            View My Orders
          </Link>
        )}
        <Link
          to="/shop"
          className="flex-1 rounded-lg px-6 py-3 text-center font-semibold text-ink ring-1 ring-slate-200 transition hover:bg-surface"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}