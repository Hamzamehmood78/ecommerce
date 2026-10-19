import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import StatCard from "../../components/admin/StatCard";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/orders/StatusBadge";
import { formatMoney } from "../../utils/currency";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const loadCustomer = () => {
    api
      .get(`/customers/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(loadCustomer, [id]);

  const setBlocked = async (isBlocked) => {
    setBlocking(true);
    try {
      await api.put(`/customers/${id}/block`, { isBlocked });
      toast.success(isBlocked ? "Customer blocked" : "Customer unblocked");
      setConfirmBlock(false);
      loadCustomer();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBlocking(false);
    }
  };

  if (error) {
    return (
      <div>
        <p className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error}</p>
        <Link to="/admin/customers" className="mt-3 inline-block text-primary hover:underline">Back to Customers</Link>
      </div>
    );
  }

  if (!data) return <p className="text-muted">Loading...</p>;

  const { customer, stats, orders, addresses, wishlist } = data;

  // Saved addresses + orders mein use hue addresses (duplicate hata kar)
  const seenAddresses = new Set();
  const allAddresses = [...(customer.addresses || []), ...addresses].filter((a) => {
    const key = [a.addressLine1, a.city, a.zip].join("|").toLowerCase();
    if (seenAddresses.has(key)) return false;
    seenAddresses.add(key);
    return true;
  });

  return (
    <div>
      <Link to="/admin/customers" className="text-sm text-muted hover:text-primary">← Back to Customers</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">{customer.name}</h1>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                customer.isBlocked ? "bg-red-50 text-danger" : "bg-green-50 text-success"
              }`}
            >
              {customer.isBlocked ? "Blocked" : "Active"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{customer.email}</p>
          <p className="text-sm text-muted">{customer.phone || "No phone number"}</p>
          <p className="mt-1 text-xs text-muted">Joined {formatDate(customer.createdAt)}</p>
        </div>

        {customer.isBlocked ? (
          <button
            onClick={() => setBlocked(false)}
            disabled={blocking}
            className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Unblock
          </button>
        ) : (
          <button
            onClick={() => setConfirmBlock(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-danger ring-1 ring-red-200 hover:bg-red-50"
          >
            Block Customer
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <StatCard label="Total Orders" value={stats.orderCount} />
        <StatCard label="Total Spent" value={`${formatMoney(stats.totalSpent)}`} color="text-primary" />
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">Order History</h3>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">This customer has not placed any orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="py-2">Order</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-slate-100">
                    <td className="py-2 font-mono text-xs text-ink">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="py-2 text-muted">{formatDate(o.createdAt)}</td>
                    <td className="py-2 text-muted">{o.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                    <td className="py-2 text-ink">{formatMoney(o.totalPrice)}</td>
                    <td className="py-2"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold text-ink">Addresses</h3>
          {allAddresses.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No addresses yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {allAddresses.map((a, i) => (
                <div key={i} className="rounded-lg bg-surface p-3 text-sm text-muted">
                  <p className="font-medium text-ink">{a.fullName}, {a.phone}</p>
                  <p>
                    {a.addressLine1}{a.addressLine2 && `, ${a.addressLine2}`}, {a.city}
                    {a.state && `, ${a.state}`} - {a.zip}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold text-ink">Wishlist</h3>
          {wishlist.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Wishlist is empty.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {wishlist.map((p) => (
                <a
                  key={p._id}
                  href={`/product/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-surface"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <span className="flex-1 truncate text-sm text-ink">{p.name}</span>
                  <span className="text-sm text-muted">
                    {formatMoney((p.discountPrice > 0 ? p.discountPrice : p.price))}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmBlock}
        title="Block Customer"
        message={`Block "${customer.name}"? They will not be able to log in or place orders until you unblock them.`}
        onConfirm={() => setBlocked(true)}
        onCancel={() => setConfirmBlock(false)}
        confirming={blocking}
        confirmLabel="Block"
        confirmingLabel="Blocking..."
      />
    </div>
  );
}