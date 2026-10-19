import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import StatCard from "../../components/admin/StatCard";
import StockAdjustModal from "../../components/admin/StockAdjustModal";

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const sourceLabels = {
  manual: "Manual adjustment",
  order: "Order",
  product_edit: "Product edit",
  initial: "Initial stock",
};

function StockBadge({ stock, threshold }) {
  if (stock === 0) {
    return <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-danger">Out of Stock</span>;
  }
  if (stock <= threshold) {
    return <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-warning">Low Stock</span>;
  }
  return <span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">In Stock</span>;
}

function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button
        onClick={() => onChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        className="rounded-lg px-3 py-1.5 ring-1 ring-slate-200 hover:bg-surface disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-muted">Page {page} of {pages}</span>
      <button
        onClick={() => onChange(Math.min(page + 1, pages))}
        disabled={page === pages}
        className="rounded-lg px-3 py-1.5 ring-1 ring-slate-200 hover:bg-surface disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

export default function AdminInventory() {
  const [tab, setTab] = useState("stock");

  // Stock levels
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");
  const [threshold, setThreshold] = useState(5);
  const [thresholdInput, setThresholdInput] = useState("5");
  const [counts, setCounts] = useState({ low: 0, out: 0 });
  const [loading, setLoading] = useState(true);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);

  // History
  const [logs, setLogs] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyProduct, setHistoryProduct] = useState(null);

  const loadStock = () => {
    setLoading(true);
    api
      .get("/inventory", { params: { keyword, filter, page, limit: 15 } })
      .then(({ data }) => {
        setProducts(data.products);
        setPages(data.pages);
        setThreshold(data.threshold);
        setThresholdInput(String(data.threshold));
        setCounts({ low: data.lowCount, out: data.outCount });
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    const params = { page: historyPage, limit: 20 };
    if (historyProduct) params.product = historyProduct._id;
    api
      .get("/inventory/history", { params })
      .then(({ data }) => {
        setLogs(data.logs);
        setHistoryPages(data.pages);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadStock, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, filter, page]);

  useEffect(loadHistory, [historyPage, historyProduct]);

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await api.put("/inventory/threshold", { threshold: Number(thresholdInput) });
      toast.success("Low-stock threshold saved");
      loadStock();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingThreshold(false);
    }
  };

  const showHistoryFor = (product) => {
    setHistoryProduct(product);
    setHistoryPage(1);
    setTab("history");
  };

  const handleAdjusted = () => {
    setAdjustTarget(null);
    loadStock();
    loadHistory();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Inventory</h1>

      <div className="mt-4 flex gap-2">
        {[
          { key: "stock", label: "Stock Levels" },
          { key: "history", label: "History" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock" && (
        <div className="mt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Low Stock Products" value={counts.low} color="text-warning" />
            <StatCard label="Out of Stock Products" value={counts.out} color="text-danger" />
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Low-Stock Threshold</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="w-20 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={saveThreshold}
                  disabled={savingThreshold || thresholdInput === String(threshold)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">At or below this number = Low Stock</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
              <Search size={16} className="text-muted" />
              <input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or SKU..."
                className="w-56 bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
            {[
              { key: "all", label: "All" },
              { key: "low", label: "Low Stock" },
              { key: "out", label: "Out of Stock" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
                  filter === f.key ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">No products found.</td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <span className="font-medium text-ink">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.sku || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{p.stock}</td>
                      <td className="px-4 py-3"><StockBadge stock={p.stock} threshold={threshold} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button onClick={() => setAdjustTarget(p)} className="mr-3 text-sm font-medium text-primary hover:underline">
                          Adjust
                        </button>
                        <button onClick={() => showHistoryFor(p)} className="text-sm font-medium text-muted hover:text-primary hover:underline">
                          History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pager page={page} pages={pages} onChange={setPage} />
        </div>
      )}

      {tab === "history" && (
        <div className="mt-5">
          {historyProduct && (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-2 text-sm">
              <span className="text-ink">Showing history for <strong>{historyProduct.name}</strong></span>
              <button
                onClick={() => {
                  setHistoryProduct(null);
                  setHistoryPage(1);
                }}
                className="font-medium text-primary hover:underline"
              >
                Show all
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No stock changes recorded yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-t border-slate-100">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{log.product?.name || "(deleted product)"}</p>
                        <p className="text-xs text-muted">{log.product?.sku}</p>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${log.change > 0 ? "text-success" : "text-danger"}`}>
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{log.previousStock} → {log.newStock}</td>
                      <td className="px-4 py-3">
                        <p className="text-ink">{log.reason}</p>
                        <p className="text-xs text-muted">{sourceLabels[log.source]}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{log.user?.name || "System"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pager page={historyPage} pages={historyPages} onChange={setHistoryPage} />
        </div>
      )}

      <StockAdjustModal
        open={!!adjustTarget}
        product={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSaved={handleAdjusted}
      />
    </div>
  );
}