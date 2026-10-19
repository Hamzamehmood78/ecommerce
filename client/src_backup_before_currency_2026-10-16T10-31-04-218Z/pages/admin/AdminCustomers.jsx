import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Download } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const downloadCSV = (filename, rows) => {
  if (rows.length === 0) {
    toast.error("No customers to export");
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

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blocking, setBlocking] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadCustomers = () => {
    setLoading(true);
    api
      .get("/customers", { params: { keyword, page, limit: 15 } })
      .then(({ data }) => {
        setCustomers(data.customers);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, page]);

  const setBlocked = async (customer, isBlocked) => {
    setBlocking(true);
    try {
      await api.put(`/customers/${customer._id}/block`, { isBlocked });
      toast.success(isBlocked ? "Customer blocked" : "Customer unblocked");
      setBlockTarget(null);
      loadCustomers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBlocking(false);
    }
  };

  const handleToggle = (customer) => {
    if (customer.isBlocked) {
      setBlocked(customer, false);
    } else {
      setBlockTarget(customer);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/customers", { params: { keyword, limit: 1000 } });
      downloadCSV(
        "customers.csv",
        data.customers.map((c) => ({
          Name: c.name,
          Email: c.email,
          Phone: c.phone || "",
          Orders: c.orderCount,
          "Total Spent": c.totalSpent,
          Joined: formatDate(c.createdAt),
          Status: c.isBlocked ? "Blocked" : "Active",
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
          Customers <span className="text-base font-normal text-muted">({total})</span>
        </h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface disabled:opacity-60"
        >
          <Download size={16} /> {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="mt-4 flex max-w-sm items-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
        <Search size={16} className="text-muted" />
        <input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email or phone..."
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No customers found.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                                        <p className="font-medium text-ink">
                      {c.name}
                      {c.isGuest && (
                        <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-muted">
                          Guest
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-ink">{c.orderCount}</td>
                  <td className="px-4 py-3 text-ink">Rs {c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        c.isBlocked ? "bg-red-50 text-danger" : "bg-green-50 text-success"
                      }`}
                    >
                      {c.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link to={`/admin/customers/${c._id}`} className="mr-3 text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                    <button
                      onClick={() => handleToggle(c)}
                      className={`text-sm font-medium hover:underline ${c.isBlocked ? "text-success" : "text-danger"}`}
                    >
                      {c.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))
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

      <ConfirmDialog
        open={!!blockTarget}
        title="Block Customer"
        message={`Block "${blockTarget?.name}"? They will not be able to log in or place orders until you unblock them.`}
        onConfirm={() => setBlocked(blockTarget, true)}
        onCancel={() => setBlockTarget(null)}
        confirming={blocking}
        confirmLabel="Block"
        confirmingLabel="Blocking..."
      />
    </div>
  );
}