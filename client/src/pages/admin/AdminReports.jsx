import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../../api/axios";
import SimpleBarChart from "../../components/admin/SimpleBarChart";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/orders/StatusBadge";
import { formatMoney } from "../../utils/currency";

const presets = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

const toInputDate = (date) => new Date(date).toISOString().slice(0, 10);

const downloadCSV = (filename, rows) => {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function AdminReports() {
  const [tab, setTab] = useState("sales");
  const [from, setFrom] = useState(toInputDate(Date.now() - 29 * 86400000));
  const [to, setTo] = useState(toInputDate(Date.now()));

  const [sales, setSales] = useState(null);
  const [products, setProducts] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setLoading(true);
    const params = { from, to };
    Promise.all([
      api.get("/admin/reports/sales", { params }),
      api.get("/admin/reports/products", { params }),
      api.get("/admin/reports/customers", { params }),
      api.get("/admin/reports/order-status", { params }),
    ])
      .then(([s, p, c, o]) => {
        setSales(s.data);
        setProducts(p.data);
        setCustomers(c.data);
        setOrderStatus(o.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, [from, to]);

  const applyPreset = (days) => {
    setTo(toInputDate(Date.now()));
    setFrom(toInputDate(Date.now() - (days - 1) * 86400000));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Reports & Analytics</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-slate-200 hover:bg-surface"
          >
            {p.label}
          </button>
        ))}
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200" />
        <span className="text-muted">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200" />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {["sales", "products", "customers", "order-status"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-slate-200"
            }`}
          >
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-muted">Loading...</p>
      ) : (
        <div className="mt-5">
          {tab === "sales" && sales && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Revenue" value={`${formatMoney(sales.totalRevenue)}`} color="text-primary" />
                <StatCard label="Total Orders" value={sales.totalOrders} />
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">Revenue by Day</h3>
                  <button
                    onClick={() => downloadCSV("sales-report.csv", sales.daily)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                <div className="mt-4">
                  <SimpleBarChart data={sales.daily} labelKey="date" valueKey="revenue" formatValue={(v) => `${formatMoney(v)}`} />
                </div>
              </div>
            </div>
          )}

          {tab === "products" && products && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">Top Selling Products</h3>
                  <button
                    onClick={() => downloadCSV("top-products.csv", products.topSelling.map((p) => ({ name: p.name, unitsSold: p.unitsSold, revenue: p.revenue })))}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
                <div className="mt-4">
                  <SimpleBarChart data={products.topSelling} labelKey="name" valueKey="revenue" formatValue={(v) => `${formatMoney(v)}`} />
                </div>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-semibold text-ink">Worst Selling Products</h3>
                <div className="mt-4">
                  <SimpleBarChart data={products.worstSelling} labelKey="name" valueKey="unitsSold" formatValue={(v) => `${v} sold`} />
                </div>
              </div>
            </div>
          )}

          {tab === "customers" && customers && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="New Customers" value={customers.newCustomers} color="text-success" />
                <StatCard label="Returning Customers" value={customers.returningCustomers} color="text-info" />
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">Top Spenders</h3>
                  <button
                    onClick={() => downloadCSV("top-spenders.csv", customers.topSpenders.map((c) => ({ name: c.name, email: c.email, totalSpent: c.totalSpent, orders: c.orderCount })))}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-muted">
                      <tr>
                        <th className="py-2">Customer</th>
                        <th className="py-2">Orders</th>
                        <th className="py-2 text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.topSpenders.map((c) => (
                        <tr key={c.email} className="border-t border-slate-100">
                          <td className="py-2 text-ink">{c.name}<div className="text-xs text-muted">{c.email}</div></td>
                          <td className="py-2 text-muted">{c.orderCount}</td>
                          <td className="py-2 text-right font-medium text-ink">{formatMoney(c.totalSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "order-status" && orderStatus && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-ink">Order Status Breakdown</h3>
              <div className="mt-4 space-y-3">
                {orderStatus.breakdown.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <StatusBadge status={s.status} />
                    <span className="font-medium text-ink">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}