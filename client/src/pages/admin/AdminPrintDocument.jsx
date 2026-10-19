import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { paymentStatusOf } from "../../components/orders/PaymentBadge";
import { STORE_NAME } from "../../config";
import TaxRow from "../../components/orders/TaxRow";
import { formatMoney } from "../../utils/currency";
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Naye tab mein khulta hai (Admin ke sidebar ke baghair), sirf print ke liye
export default function AdminPrintDocument() {
  const { id, type } = useParams();
  const [order, setOrder] = useState(null);
  const [store, setStore] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/orders/admin/${id}`), api.get("/settings")])
      .then(([orderRes, settingsRes]) => {
        setOrder(orderRes.data);
        setStore(settingsRes.data.store || {});
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <p className="p-8 text-danger">{error}</p>;
  if (!order) return <p className="p-8 text-muted">Loading...</p>;
  if (!["invoice", "label"].includes(type)) return <p className="p-8 text-muted">Unknown document.</p>;

  const storeName = store.name || STORE_NAME;
  const address = order.shippingAddress;
  const orderNo = `#${order._id.slice(-8).toUpperCase()}`;
  const payment = paymentStatusOf(order);
  const collectOnDelivery = order.paymentMethod === "cod" && !order.isPaid;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-4 flex justify-end gap-3 px-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface"
          >
            Close
          </button>
        </div>

        {type === "invoice" ? (
          <div className="bg-white p-8 shadow-sm print:p-0 print:shadow-none">
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary">{storeName}</h1>
                {store.address && <p className="mt-1 text-sm text-muted">{store.address}</p>}
                {store.phone && <p className="text-sm text-muted">{store.phone}</p>}
                {store.email && <p className="text-sm text-muted">{store.email}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold tracking-wide text-ink">INVOICE</h2>
                <p className="mt-1 text-sm text-muted">Order {orderNo}</p>
                <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Bill / Ship To</p>
                <p className="mt-1 font-medium text-ink">{address.fullName}</p>
                <p className="text-muted">{address.phone}</p>
                <p className="text-muted">
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                  <br />
                  {address.city}
                  {address.state && `, ${address.state}`} - {address.zip}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-muted">Payment</p>
                <p className="mt-1 font-medium text-ink">
                  {order.paymentMethod === "card" ? "Card (Stripe)" : "Cash on Delivery"}
                </p>
                <p className="text-muted">{payment.text}</p>
                <p className="mt-2 text-xs font-semibold uppercase text-muted">Delivery</p>
                <p className="font-medium capitalize text-ink">{order.deliveryMethod}</p>
              </div>
            </div>

            <table className="mt-8 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-xs uppercase text-muted">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2.5 text-ink">
                      {item.name}
                      {(item.size || item.color) && (
                        <span className="block text-xs text-muted">
                          {item.size && `Size: ${item.size}`} {item.size && item.color && "•"}{" "}
                          {item.color && `Color: ${item.color}`}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-muted">{formatMoney(item.price)}</td>
                    <td className="py-2.5 text-right text-muted">{item.quantity}</td>
                    <td className="py-2.5 text-right text-ink">{formatMoney((item.price * item.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatMoney(order.itemsPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>- {formatMoney(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{order.shippingPrice === 0 ? "Free" : `${formatMoney(order.shippingPrice)}`}</span>
              </div>
              <TaxRow order={order} />
              <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatMoney(order.totalPrice)}</span>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-muted">Thank you for shopping with {storeName}.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-md border-2 border-ink bg-white p-6 print:max-w-none">
            <div className="flex items-start justify-between border-b-2 border-dashed border-slate-400 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">From</p>
                <p className="font-bold text-ink">{storeName}</p>
                {store.address && <p className="text-xs text-muted">{store.address}</p>}
                {store.phone && <p className="text-xs text-muted">{store.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-muted">Order</p>
                <p className="font-mono text-lg font-bold text-ink">{orderNo}</p>
              </div>
            </div>

            <div className="py-5">
              <p className="text-xs font-semibold uppercase text-muted">Ship To</p>
              <p className="mt-1 text-2xl font-bold text-ink">{address.fullName}</p>
              <p className="mt-1 text-lg text-ink">
                {address.addressLine1}
                {address.addressLine2 && `, ${address.addressLine2}`}
              </p>
              <p className="text-lg text-ink">
                {address.city}
                {address.state && `, ${address.state}`} - {address.zip}
              </p>
              <p className="mt-2 text-xl font-bold text-ink">Tel: {address.phone}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t-2 border-dashed border-slate-400 pt-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Delivery</p>
                <p className="font-semibold capitalize text-ink">{order.deliveryMethod}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Items</p>
                <p className="font-semibold text-ink">{order.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
              </div>
              {order.trackingNumber && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase text-muted">Tracking</p>
                  <p className="font-mono font-semibold text-ink">{order.trackingNumber}</p>
                </div>
              )}
            </div>

            {collectOnDelivery && (
              <div className="mt-4 rounded border-2 border-ink p-3 text-center">
                <p className="text-xs font-semibold uppercase">Cash on Delivery: collect</p>
                <p className="text-2xl font-bold text-ink">{formatMoney(order.totalPrice)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}