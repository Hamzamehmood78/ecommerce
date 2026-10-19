import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../adminPermissions";
import StatCard from "../../components/admin/StatCard";
import DateRangeFilter from "../../components/admin/DateRangeFilter";
import RevenueChart from "../../components/admin/RevenueChart";
import StatusBreakdown from "../../components/admin/StatusBreakdown";
import StatusBadge from "../../components/orders/StatusBadge";
import { rangeForPreset, formatRangeDate } from "../../utils/dateRanges";

const FLOW = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];
const nextOptions = (status) => {
  const i = FLOW.indexOf(status);
  return i === -1 ? [] : FLOW.slice(i + 1);
};

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function AdminDashboard() {
  const { user } = useAuth();
  const canUpdateOrders = hasPermission(user, "orders");
  const canRestock = hasPermission(user, "inventory");

  const [range, setRange] = useState(() => ({ key: "month", ...rangeForPreset("month") }));
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    api
      .get("/admin/stats", {
        params: { from: range.from.toISOString(), to: range.to.toISOString(), timezone: timeZone },
      })
      .then(({ data }) => {
        if (!ignore) setStats(data);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [range, reloadKey]);

  const handleStatusChange = async (orderId, status) => {
    if (!status) return;
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {formatRangeDate(range.from)} – {formatRangeDate(range.to)}
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error}</div>
      )}

      {!stats && !error && (
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {stats && (
        <div className={`transition ${loading ? "opacity-60" : ""}`}>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={`Rs ${stats.totalRevenue.toLocaleString()}`}
              color="text-primary"
              hint="Cancelled & returned excluded"
            />
            <StatCard label="Total Orders" value={stats.totalOrders} hint="Placed in this period" />
            <StatCard label="Pending Orders" value={stats.pendingOrders} color="text-warning" />
            <StatCard label="Processing / Shipped" value={stats.processingOrders} color="text-info" />
            <StatCard label="Delivered Orders" value={stats.deliveredOrders} color="text-success" />
            <StatCard label="Returned / Refunded" value={stats.returnedOrders} color="text-danger" />
            <StatCard label="Cancelled Orders" value={stats.cancelledOrders} color="text-danger" />
            <StatCard
              label="Total Customers"
              value={stats.totalCustomers}
              hint={`+${stats.newCustomers} new in this period`}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
              <h3 className="font-semibold text-ink">
                Sales {stats.range.groupBy === "month" ? "by Month" : "by Day"}
              </h3>
              <div className="mt-3">
                <RevenueChart data={stats.salesSeries} />
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-ink">Orders by Status</h3>
              <div className="mt-4">
                <StatusBreakdown data={stats.statusBreakdown} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-ink">Top Selling Products</h3>
              {stats.topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No sales in this period.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {stats.topProducts.map((p, i) => (
                    <div key={p._id || i} className="flex items-center gap-3">
                      <span className="w-5 text-center text-sm font-semibold text-muted">{i + 1}</span>
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{p.unitsSold} sold</p>
                      </div>
                      <span className="text-sm font-semibold text-ink">Rs {p.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-ink">Low Stock Alert</h3>
              {stats.lowStockProducts.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No products are low on stock.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {stats.lowStockProducts.map((p) => (
                    <div key={p._id} className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className={`text-xs font-medium ${p.stock === 0 ? "text-danger" : "text-warning"}`}>
                          {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                        </p>
                      </div>
                      {canRestock && (
                        <Link to="/admin/inventory" className="text-sm font-medium text-primary hover:underline">
                          Restock
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Recent Orders</h3>
              {canUpdateOrders && (
                <Link to="/admin/orders" className="text-sm font-medium text-primary hover:underline">
                  View all →
                </Link>
              )}
            </div>

            {stats.recentOrders.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No orders in this period.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr>
                      <th className="py-2">Order</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Status</th>
                      {canUpdateOrders && <th className="py-2">Update</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((o) => {
                      const options = nextOptions(o.status);
                      return (
                        <tr key={o._id} className="border-t border-slate-100">
                          <td className="py-2.5 font-mono text-xs">
                            {canUpdateOrders ? (
                              <Link to={`/admin/orders/${o._id}`} className="font-semibold text-primary hover:underline">
                                #{o._id.slice(-8).toUpperCase()}
                              </Link>
                            ) : (
                              <span className="text-ink">#{o._id.slice(-8).toUpperCase()}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-ink">{o.user?.name || o.shippingAddress?.fullName || "—"}</td>
                          <td className="py-2.5 text-ink">Rs {o.totalPrice.toLocaleString()}</td>
                          <td className="py-2.5"><StatusBadge status={o.status} /></td>
                          {canUpdateOrders && (
                            <td className="py-2.5">
                              {options.length === 0 ? (
                                <span className="text-xs text-muted">—</span>
                              ) : (
                                <select
                                  value=""
                                  disabled={updatingId === o._id}
                                  onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                  className="rounded-lg px-2 py-1.5 text-xs capitalize ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
                                >
                                  <option value="">Move to...</option>
                                  {options.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}