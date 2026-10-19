import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import CategoryFormModal from "../../components/admin/CategoryFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

// Ek hi parent ke neeche ki categories ek "group" hain (top-level ka group "root")
const groupOf = (c) => c.parent?._id || "root";
const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);
const siblingsOf = (all, groupKey) => all.filter((c) => groupOf(c) === groupKey).sort(byOrder);

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const loadCategories = () => {
    setLoading(true);
    api
      .get("/categories/admin/all")
      .then(({ data }) => setCategories(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      toast.success("Category deleted");
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (cat) => {
    try {
      await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Naya order foran dikhate hain, phir server mein save; fail ho to wapas load
  const applyOrder = async (ordered) => {
    setCategories((prev) =>
      prev.map((c) => {
        const index = ordered.findIndex((o) => o._id === c._id);
        return index === -1 ? c : { ...c, sortOrder: index };
      })
    );
    try {
      await api.put("/categories/reorder", { orderedIds: ordered.map((c) => c._id) });
    } catch (err) {
      toast.error(getErrorMessage(err));
      loadCategories();
    }
  };

  const moveItem = (fromId, toId) => {
    const from = categories.find((c) => c._id === fromId);
    const to = categories.find((c) => c._id === toId);
    if (!from || !to || groupOf(from) !== groupOf(to)) return;

    const siblings = siblingsOf(categories, groupOf(from));
    const fromIndex = siblings.findIndex((c) => c._id === fromId);
    const toIndex = siblings.findIndex((c) => c._id === toId);

    const reordered = [...siblings];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, from);
    applyOrder(reordered);
  };

  const moveByArrow = (cat, direction) => {
    const siblings = siblingsOf(categories, groupOf(cat));
    const index = siblings.findIndex((c) => c._id === cat._id);
    const target = siblings[index + direction];
    if (target) moveItem(cat._id, target._id);
  };

  const dragCategory = categories.find((c) => c._id === dragId);
  const canDropOn = (cat) => dragCategory && groupOf(dragCategory) === groupOf(cat);

  const handleDrop = (targetId) => {
    if (dragId && dragId !== targetId) moveItem(dragId, targetId);
    setDragId(null);
    setOverId(null);
  };

  const renderRow = (cat, depth) => {
    const siblings = siblingsOf(categories, groupOf(cat));
    const index = siblings.findIndex((c) => c._id === cat._id);

    return (
      <tr
        key={cat._id}
        draggable
        onDragStart={() => setDragId(cat._id)}
        onDragEnd={() => {
          setDragId(null);
          setOverId(null);
        }}
        onDragOver={(e) => {
          if (canDropOn(cat)) {
            e.preventDefault();
            setOverId(cat._id);
          }
        }}
        onDrop={() => handleDrop(cat._id)}
        className={`border-t border-slate-100 ${
          overId === cat._id && dragId !== cat._id ? "bg-primary/10" : ""
        } ${dragId === cat._id ? "opacity-50" : ""}`}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 28 }}>
            <GripVertical size={16} className="cursor-grab text-muted" />
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {cat.image && <img src={cat.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className={`font-medium ${depth > 0 ? "text-muted" : "text-ink"}`}>
              {depth > 0 && "↳ "}
              {cat.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => toggleActive(cat)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              cat.isActive ? "bg-green-50 text-success" : "bg-slate-100 text-muted"
            }`}
          >
            {cat.isActive ? "Active" : "Hidden"}
          </button>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          <button
            onClick={() => moveByArrow(cat, -1)}
            disabled={index === 0}
            aria-label="Move up"
            className="mr-1 text-muted hover:text-primary disabled:opacity-30"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => moveByArrow(cat, 1)}
            disabled={index === siblings.length - 1}
            aria-label="Move down"
            className="mr-3 text-muted hover:text-primary disabled:opacity-30"
          >
            <ArrowDown size={16} />
          </button>
          <button onClick={() => { setEditingCategory(cat); setModalOpen(true); }} className="mr-2 text-muted hover:text-primary" aria-label="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteTarget(cat)} className="text-muted hover:text-danger" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </td>
      </tr>
    );
  };

  const topLevel = siblingsOf(categories, "root");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Categories</h1>
        <button
          onClick={() => { setEditingCategory(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Drag a row (or use the arrows) to change the order. The order is used on the store's Home page and menu.
        Categories can be reordered within the same level.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Order & Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">No categories yet.</td></tr>
            ) : (
              topLevel.map((cat) => (
                <FragmentRows key={cat._id}>
                  {renderRow(cat, 0)}
                  {siblingsOf(categories, cat._id).map((child) => renderRow(child, 1))}
                </FragmentRows>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadCategories(); }}
        editingCategory={editingCategory}
        categories={categories}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}

// Table ke andar ek parent aur uske bachchon ki rows ko ek saath rakhne ke liye
function FragmentRows({ children }) {
  return <>{children}</>;
}