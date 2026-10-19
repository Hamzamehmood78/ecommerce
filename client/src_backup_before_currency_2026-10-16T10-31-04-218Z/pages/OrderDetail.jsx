import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Printer } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import { useCart } from "../context/CartContext";
import StatusBadge from "../components/orders/StatusBadge";
import StatusTimeline from "../components/orders/StatusTimeline";
import ReasonDialog from "../components/admin/ReasonDialog";
import TaxRow from "../components/orders/TaxRow";

const RETURN_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returning, setReturning] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrder, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, { reason: "Cancelled by customer" });
      toast.success(data.isRefunded ? "Order cancelled. Your payment has been refunded." : "Order cancelled");
      setShowCancelConfirm(false);
      loadOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleReturn = async (reason) => {
    setReturning(true);
    try {
      await api.post(`/orders/${id}/return`, { reason });
      toast.success("Return request sent. We will review it soon.");
      setShowReturnDialog(false);
      loadOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReturning(false);
    }
  };

  const handleReorder = () => {
    order.items.forEach((item) => {
      addItem(
        { _id: item.product?._id || item.product, name: item.name, images: [item.image], price: item.price, discountPrice: 0, stock: 999 },
        item.quantity,
        item.size,
        item.color
      );
    });
    navigate("/cart");
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl animate-pulse px-4 py-12"><div className="h-80 rounded-xl bg-slate-100" /></div>;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error || "Order not found"}</p>
        <Link to="/account/orders" className="mt-4 inline-block text-primary hover:underline">Back to My Orders</Link>
      </div>
    );
  }

  const canCancel = ["pending", "processing"].includes(order.status);

  const returnStatus = order.returnRequest?.status || "none";
  const deliveredAt = order.deliveredAt || order.updatedAt;
  const daysLeft = Math.ceil(RETURN_WINDOW_DAYS - (Date.now() - new Date(deliveredAt).getTime()) / DAY_MS);
  const canReturn = order.status === "delivered" && returnStatus === "none" && daysLeft > 0;

  const paymentText = order.isRefunded ? "Refunded" : order.isPaid ? "Paid" : "Payment pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/account/orders" className="text-sm text-muted hover:text-primary">← Back to My Orders</Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <StatusTimeline status={order.status} />

        {order.trackingNumber && (
          <p className="mt-4 text-sm text-muted">
            Tracking Number: <span className="font-medium text-ink">{order.trackingNumber}</span>
          </p>
        )}
        {order.status === "cancelled" && order.cancelReason && (
          <p className="mt-3 text-sm text-muted">
            Cancellation reason: <span className="text-ink">{order.cancelReason}</span>
          </p>
        )}
      </div>

      {returnStatus === "requested" && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-warning ring-1 ring-amber-200">
          Your return request has been received and is being reviewed.
        </p>
      )}
      {returnStatus === "approved" && order.status !== "returned" && (
        <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-success ring-1 ring-green-200">
          Your return has been approved. Your refund will be processed shortly.
        </p>
      )}
      {returnStatus === "rejected" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-danger ring-1 ring-red-200">
          Your return request was not approved.
          {order.returnRequest.adminNote && ` Reason: ${order.returnRequest.adminNote}`}
        </p>
      )}
      {order.status === "returned" && (
        <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-success ring-1 ring-green-200">
          Your return is complete{order.isRefunded ? " and your refund has been processed." : "."}
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl bg-surface p-4">
          <h3 className="text-sm font-semibold text-ink">Shipping Address</h3>
          <p className="mt-1 text-sm text-muted">
            {order.shippingAddress.fullName}, {order.shippingAddress.phone}
            <br />
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
            <br />
            {order.shippingAddress.city}
            {order.shippingAddress.state && `, ${order.shippingAddress.state}`} - {order.shippingAddress.zip}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4">
          <h3 className="text-sm font-semibold text-ink">Payment</h3>
          <p className="mt-1 text-sm text-muted">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
            <br />
            {paymentText}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-3 text-sm font-semibold text-ink">Items</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => {
            const slug = item.product?.slug;
            return (
              <div key={i} className="flex items-center gap-3">
                {slug ? (
                  <Link to={`/product/${slug}`} className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </Link>
                ) : (
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                )}
                <div className="flex-1 text-sm">
                  {slug ? (
                    <Link to={`/product/${slug}`} className="font-medium text-ink hover:text-primary">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-medium text-ink">{item.name}</p>
                  )}
                  <p className="text-muted">
                    Qty: {item.quantity}
                    {item.size && ` • Size: ${item.size}`}
                    {item.color && ` • Color: ${item.color}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink">Rs {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            );
          })}
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
            <span>Total</span>
            <span>Rs {order.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-surface px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          <Printer size={16} /> Download Invoice
        </button>

        {order.status === "delivered" && (
          <button
            onClick={handleReorder}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
          >
            Reorder
          </button>
        )}

        {canReturn && (
          <button
            onClick={() => setShowReturnDialog(true)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-slate-300 transition hover:bg-surface"
          >
            Return / Request Refund
            <span className="ml-1.5 text-xs font-normal text-muted">({daysLeft} day{daysLeft === 1 ? "" : "s"} left)</span>
          </button>
        )}

        {canCancel && !showCancelConfirm && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-danger ring-1 ring-red-200 transition hover:bg-red-50"
          >
            Cancel Order
          </button>
        )}

        {showCancelConfirm && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 ring-1 ring-red-200">
            <span className="text-sm text-danger">Are you sure?</span>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-md bg-danger px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </button>
            <button onClick={() => setShowCancelConfirm(false)} className="text-sm font-medium text-ink">
              No
            </button>
          </div>
        )}
      </div>

      <ReasonDialog
        open={showReturnDialog}
        title="Return / Request Refund"
        message={`You can return a delivered order within ${RETURN_WINDOW_DAYS} days. Our team will review your request.`}
        label="Why are you returning this order?"
        placeholder="e.g. The item is damaged or not as described"
        confirmLabel="Send Request"
        confirmingLabel="Sending..."
        minLength={5}
        destructive={false}
        submitting={returning}
        onConfirm={handleReturn}
        onCancel={() => setShowReturnDialog(false)}
      />
    </div>
  );
}