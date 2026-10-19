import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, Search, Download, ArrowUp, ArrowDown } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import ProductFormModal from "../../components/admin/ProductFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

const statusStyles = {
  active: "bg-green-50 text-success",
  draft: "bg-slate-100 text-muted",
  out_of_stock: "bg-red-50 text-danger",
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const downloadCSV = (filename, rows) => {
  if (rows.length === 0) {
    toast.error("Nothing to export");
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

function SortHeader({ label, field, sort, onSort }) {
  const active = sort.by === field;
  return (
    <th className="px-4 py-3">
      <button onClick={() => onSort(field)} className="flex items-center gap-1 uppercase hover:text-ink">
        {label}
        {active && (sort.order === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState({ by: "date", order: "desc" });
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    api
      .get("/products/admin/all", {
        params: {
          keyword: keyword.trim() || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          sortBy: sort.by,
          order: sort.order,
          page,
          limit: 15,
        },
      })
      .then(({ data }) => {
        setProducts(data.products);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/categories/admin/all").then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, categoryFilter, statusFilter, sort, page]);

  const handleSort = (field) => {
    setPage(1);
    setSort((prev) =>
      prev.by === field
        ? { by: field, order: prev.order === "asc" ? "desc" : "asc" }
        : { by: field, order: field === "name" ? "asc" : "desc" }
    );
  };

  // Status ka seedha switch
  const handleStatusChange = async (product, status) => {
    try {
      await api.put(`/products/${product._id}`, { status });
      toast.success(`"${product.name}" is now ${status.replace(/_/g, " ")}`);
      loadProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      toast.success("Product deleted");
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      loadProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // ---- Selection ----
  const allOnPageSelected = products.length > 0 && products.every((p) => selected.has(p._id));

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      products.forEach((p) => (allOnPageSelected ? next.delete(p._id) : next.add(p._id)));
      return next;
    });

  // ---- Bulk actions ----
  const runBulk = async (action, successText) => {
    setBulkBusy(true);
    try {
      const { data } = await api.post("/products/bulk", { action, ids: [...selected] });
      toast.success(`${data.affected} product(s) ${successText}`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExportSelected = async () => {
    setBulkBusy(true);
    try {
      const { data } = await api.post("/products/bulk", { action: "export", ids: [...selected] });
      downloadCSV(
        "products.csv",
        data.products.map((p) => ({
          Name: p.name,
          SKU: p.sku || "",
          Category: p.category?.name || "",
          Brand: p.brand || "",
          Price: p.price,
          "Discount Price": p.discountPrice || 0,
          Stock: p.stock,
          Status: p.status.replace(/_/g, " "),
          Featured: p.isFeatured ? "Yes" : "No",
          Added: formatDate(p.createdAt),
        }))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const resetPageOnChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">
          Products <span className="text-base font-normal text-muted">({total})</span>
        </h1>
        <button
          onClick={() => { setEditingProduct(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
          <Search size={16} className="text-muted" />
          <input
            value={keyword}
            onChange={resetPageOnChange(setKeyword)}
            placeholder="Search name, brand or SKU..."
            className="w-60 bg-transparent px-2 py-2 text-sm outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={resetPageOnChange(setCategoryFilter)}
          className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={resetPageOnChange(setStatusFilter)}
          className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-primary/5 px-4 py-3 ring-1 ring-primary/20">
          <span className="text-sm font-medium text-ink">{selected.size} selected</span>
          <button
            onClick={() => runBulk("activate", "activated")}
            disabled={bulkBusy}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-success ring-1 ring-slate-200 hover:bg-surface disabled:opacity-50"
          >
            Activate
          </button>
          <button
            onClick={() => runBulk("deactivate", "moved to Draft")}
            disabled={bulkBusy}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface disabled:opacity-50"
          >
            Deactivate
          </button>
          <button
            onClick={handleExportSelected}
            disabled={bulkBusy}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            disabled={bulkBusy}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-danger ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm font-medium text-muted hover:text-ink">
            Clear selection
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Select all on this page"
                  className="h-4 w-4 rounded accent-primary"
                />
              </th>
              <SortHeader label="Product" field="name" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3">Category</th>
              <SortHeader label="Price" field="price" sort={sort} onSort={handleSort} />
              <SortHeader label="Stock" field="stock" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3">Status</th>
              <SortHeader label="Added" field="date" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className={`border-t border-slate-100 ${selected.has(p._id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p._id)}
                      onChange={() => toggleOne(p._id)}
                      aria-label={`Select ${p.name}`}
                      className="h-4 w-4 rounded accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3 text-ink">Rs {p.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink">{p.stock}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p, e.target.value)}
                      aria-label={`Status of ${p.name}`}
                      className={`cursor-pointer rounded-md px-2 py-1 text-xs font-semibold outline-none ${statusStyles[p.status]}`}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => { setEditingProduct(p); setModalOpen(true); }} className="mr-2 text-muted hover:text-primary" aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="text-muted hover:text-danger" aria-label="Delete">
                      <Trash2 size={16} />
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

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadProducts(); }}
        editingProduct={editingProduct}
        categories={categories}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Selected Products"
        message={`Are you sure you want to delete ${selected.size} product(s)? This cannot be undone.`}
        onConfirm={() => runBulk("delete", "deleted")}
        onCancel={() => setBulkDeleteOpen(false)}
        confirming={bulkBusy}
      />
    </div>
  );
}