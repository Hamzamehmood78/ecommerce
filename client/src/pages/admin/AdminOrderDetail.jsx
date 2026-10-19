import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Printer } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import StatusBadge from "../../components/orders/StatusBadge";
import PaymentBadge from "../../components/orders/PaymentBadge";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ReasonDialog from "../../components/admin/ReasonDialog";
import { formatMoney } from "../../utils/currency";
	import TaxRow from "../../components/orders/TaxRow";
const FLOW = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];
const label = (s) => s.replace(/_/g, " ");
const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const returnBadge = {
  requested: { text: "Return requested", cls: "bg-amber-50 text-warning" },
  approved: { text: "Return approved", cls: "bg-green-50 text-success" },
  rejected: { text: "Return rejected", cls: "bg-red-50 text-danger" },
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // "cancel" | "reject" | "refund" | null

  const load = () => {
    api
      .get(`/orders/admin/${id}`)
      .then(({ data }) => {
        setOrder(data);
        setTracking(data.trackingNumber || "");
        setNotes(data.internalNotes || "");
        setNextStatus("");
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, [id]);

  // Har action ek hi tareeqe se chalta hai: call, toast, dialog band, dobara load
  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      setDialog(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div>
        <p className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error}</p>
        <Link to="/admin/orders" className="mt-3 inline-block text-primary hover:underline">Back to Orders</Link>
      </div>
    );
  }

  if (!order) return <p className="text-muted">Loading...</p>;

  const currentIndex = FLOW.indexOf(order.status);
  const statusOptions = currentIndex === -1 ? [] : FLOW.slice(currentIndex + 1);
  const canCancel = ["pending", "processing"].includes(order.status);
  const returnStatus = order.returnRequest?.status || "none";
  const address = order.shippingAddress;
  const isCard = order.paymentMethod === "card";

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-muted hover:text-primary">← Back to Orders</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted">Placed on {formatDateTime(order.createdAt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge order={order} />
            {returnBadge[returnStatus] && (
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${returnBadge[returnStatus].cls}`}>
                {returnBadge[returnStatus].text}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/print/${order._id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface"
          >
            <Printer size={16} /> Print Invoice
          </a>
          <a
            href={`/admin/print/${order._id}/label`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface"
          >
            <Printer size={16} /> Print Shipping Label
          </a>
        </div>
      </div>

      {/* Return request */}
      {returnStatus !== "none" && (
        <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold text-ink">Return Request</h3>
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">Customer's reason:</span> {order.returnRequest.reason}
          </p>
          {order.returnRequest.requestedAt && (
            <p className="mt-1 text-xs text-muted">Requested on {formatDateTime(order.returnRequest.requestedAt)}</p>
          )}
          {order.returnRequest.adminNote && (
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Admin note:</span> {order.returnRequest.adminNote}
            </p>
          )}

          {returnStatus === "requested" && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() =>
                  run(() => api.put(`/orders/${id}/return/review`, { decision: "approve" }), "Return approved")
                }
                disabled={busy}
                className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                Approve Return
              </button>
              <button
                onClick={() => setDialog("reject")}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-danger ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
              >
                Reject Return
              </button>
            </div>
          )}

          {returnStatus === "approved" && order.status === "delivered" && (
            <div className="mt-4">
              <button
                onClick={() => setDialog("refund")}
                disabled={busy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
              >
                Process Refund
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Items */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-ink">Items</h3>
            <div className="mt-3 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-muted">
                      {formatMoney(item.price)} × {item.quantity}
                      {item.size && ` • Size: ${item.size}`}
                      {item.color && ` • Color: ${item.color}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink">
                    {formatMoney((item.price * item.quantity))}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatMoney(order.itemsPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>- {formatMoney(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping ({order.deliveryMethod})</span>
                <span>{order.shippingPrice === 0 ? "Free" : `${formatMoney(order.shippingPrice)}`}</span>
              </div>
              <TaxRow order={order} />
              <div className="flex justify-between pt-1 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatMoney(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-ink">Internal Notes</h3>
            <p className="mt-1 text-xs text-muted">Private — visible only to admins and staff, not to customers..</p>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-3 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => run(() => api.put(`/orders/${id}/status`, { internalNotes: notes }), "Notes saved")}
              disabled={busy || notes === (order.internalNotes || "")}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Status & tracking */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-ink">Update Status</h3>
            {statusOptions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                This order is <span className="font-medium capitalize text-ink">{label(order.status)}</span>.
                No further status changes are possible.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted">The customer is notified automatically by email.</p>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="mt-3 w-full rounded-lg px-3 py-2 text-sm capitalize ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
                >
                  <option value="">Move to next stage...</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{label(s)}</option>
                  ))}
                </select>
                <button
                  onClick={() => run(() => api.put(`/orders/${id}/status`, { status: nextStatus }), "Status updated")}
                  disabled={busy || !nextStatus}
                  className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  Update Status
                </button>
              </>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4">
              <label className="text-sm font-medium text-ink">Tracking Number</label>
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. TCS123456"
                className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => run(() => api.put(`/orders/${id}/status`, { trackingNumber: tracking }), "Tracking number saved")}
                disabled={busy || tracking === (order.trackingNumber || "")}
                className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface disabled:opacity-50"
              >
                Save Tracking Number
              </button>
            </div>

            {canCancel && (
              <button
                onClick={() => setDialog("cancel")}
                disabled={busy}
                className="mt-5 w-full rounded-lg px-4 py-2 text-sm font-medium text-danger ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
              >
                Cancel Order
              </button>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-ink">Customer</h3>
            <p className="mt-2 text-sm font-medium text-ink">{order.user?.name || address.fullName}</p>
            <p className="text-sm text-muted">{order.user?.email}</p>
            <p className="text-sm text-muted">{order.user?.phone || address.phone}</p>

            <h3 className="mt-5 font-semibold text-ink">Shipping Address</h3>
            <p className="mt-2 text-sm text-muted">
              {address.fullName}, {address.phone}
              <br />
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}
              <br />
              {address.city}
              {address.state && `, ${address.state}`} - {address.zip}
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-ink">Payment</h3>
            <p className="mt-2 text-sm text-muted">
              Method: <span className="font-medium text-ink">{isCard ? "Card (Stripe)" : "Cash on Delivery"}</span>
            </p>
            <div className="mt-2"><PaymentBadge order={order} /></div>
            {order.paidAt && <p className="mt-2 text-xs text-muted">Paid on {formatDateTime(order.paidAt)}</p>}
            {order.refundedAt && <p className="mt-1 text-xs text-muted">Refunded on {formatDateTime(order.refundedAt)}</p>}
            {order.paymentIntentId && (
              <p className="mt-1 break-all text-xs text-muted">Stripe ref: {order.paymentIntentId}</p>
            )}
            {order.cancelReason && order.status === "cancelled" && (
              <p className="mt-3 text-sm text-muted">
                <span className="font-medium text-ink">Cancel reason:</span> {order.cancelReason}
              </p>
            )}
          </div>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "cancel"}
        title="Cancel Order"
        message="The customer will be notified, stock will be restored, and a card payment will be refunded automatically."
        label="Cancellation reason (required)"
        placeholder="e.g. Item is out of stock"
        confirmLabel="Cancel Order"
        confirmingLabel="Cancelling..."
        submitting={busy}
        onConfirm={(reason) => run(() => api.post(`/orders/${id}/admin-cancel`, { reason }), "Order cancelled")}
        onCancel={() => setDialog(null)}
      />

      <ReasonDialog
        open={dialog === "reject"}
        title="Reject Return"
        message="The customer will see this reason."
        label="Reason for rejecting (required)"
        confirmLabel="Reject Return"
        confirmingLabel="Rejecting..."
        submitting={busy}
        onConfirm={(note) =>
          run(() => api.put(`/orders/${id}/return/review`, { decision: "reject", note }), "Return rejected")
        }
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "refund"}
        title="Process Refund"
        message={
          isCard
            ? `${formatMoney(order.totalPrice)} will be refunded to the customer's card through Stripe, the order will be marked Returned and the items restocked.`
            : "The order will be marked Returned and the items restocked. This was a Cash on Delivery order, so please return the cash to the customer yourself."
        }
        onConfirm={() => run(() => api.post(`/orders/${id}/refund`), "Refund processed")}
        onCancel={() => setDialog(null)}
        confirming={busy}
        confirmLabel="Process Refund"
        confirmingLabel="Refunding..."
      />
    </div>
  );
}