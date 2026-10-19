import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Download } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import StatusBadge from "../../components/orders/StatusBadge";
import PaymentBadge, { paymentStatusOf } from "../../components/orders/PaymentBadge";

const FLOW = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];
const tabs = ["", "pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

const label = (s) => s.replace(/_/g, " ");
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Sirf aage ke stages dikhte hain
const nextOptions = (status) => {
  const i = FLOW.indexOf(status);
  return i === -1 ? [] : FLOW.slice(i + 1);
};

const downloadCSV = (filename, rows) => {
  if (rows.length === 0) {
    toast.error("No orders to export");
    return;
  }
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    api
      .get("/orders/admin/all", {
        params: { page, limit: 15, status: activeTab || undefined, keyword: keyword.trim() || undefined },
      })
      .then(({ data }) => {
        setOrders(data.orders);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadOrders, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, activeTab, page]);

  const handleStatusChange = async (orderId, status) => {
    if (!status) return;
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      loadOrders();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/orders/admin/all", {
        params: { limit: 1000, status: activeTab || undefined, keyword: keyword.trim() || undefined },
      });
      downloadCSV(
        "orders.csv",
        data.orders.map((o) => ({
          "Order ID": `#${o._id.slice(-8).toUpperCase()}`,
          Customer: o.shippingAddress?.fullName || o.user?.name || "",
          Phone: o.shippingAddress?.phone || "",
          Date: formatDate(o.createdAt),
          Items: o.items.reduce((sum, i) => sum + i.quantity, 0),
          Subtotal: o.itemsPrice,
          Discount: o.discountAmount || 0,
          Shipping: o.shippingPrice,
          Total: o.totalPrice,
          "Payment Method": o.paymentMethod,
          "Payment Status": paymentStatusOf(o).text,
          Status: label(o.status),
          Tracking: o.trackingNumber || "",
        }))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">
          Orders <span className="text-base font-normal text-muted">({total})</span>
        </h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface disabled:opacity-60"
        >
          <Download size={16} /> {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="mt-4 flex max-w-md items-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
        <Search size={16} className="text-muted" />
        <input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          placeholder="Search by Order ID, customer name or phone..."
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab || "all"}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`flex-shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              activeTab === tab ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-slate-200"
            }`}
          >
            {tab ? label(tab) : "All"}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No orders found.</td></tr>
            ) : (
              orders.map((o) => {
                const options = nextOptions(o.status);
                return (
                  <tr key={o._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${o._id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        #{o._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {o.shippingAddress?.fullName || o.user?.name || "—"}
                      <div className="text-xs text-muted">{o.shippingAddress?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-ink">Rs {o.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3"><PaymentBadge order={o} /></td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                      {o.returnRequest?.status === "requested" && (
                        <div className="mt-1 text-xs font-medium text-warning">Return requested</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
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
                            <option key={s} value={s}>{label(s)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 ring-1 ring-slate-200 hover:bg-surface disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted">Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
            disabled={page === pages}
            className="rounded-lg px-3 py-1.5 ring-1 ring-slate-200 hover:bg-surface disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}