import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import StatusBadge from "../components/orders/StatusBadge";

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    api
      .get("/orders/my")
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab ? orders.filter((o) => o.status === activeTab) : orders;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-10">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">My Orders</h1>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error}</div>
      )}

      {!error && filtered.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-xl bg-surface px-6 py-16 text-center">
          <Package size={48} className="text-muted" />
          <h3 className="mt-4 text-lg font-semibold text-ink">No orders here</h3>
          <Link to="/shop" className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
            Start Shopping
          </Link>
        </div>
      )}

      {!error && filtered.length > 0 && (
        <div className="mt-6 space-y-4">
          {filtered.map((order) => (
            <Link
              key={order._id}
              to={`/account/orders/${order._id}`}
              className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100 ring-2 ring-white">
                      {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-xs font-medium text-muted ring-2 ring-white">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted">{order.items.length} item(s)</span>
                <span className="ml-auto font-semibold text-ink">Rs {order.totalPrice.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}