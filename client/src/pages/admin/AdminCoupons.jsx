import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import CouponFormModal from "../../components/admin/CouponFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { formatMoney } from "../../utils/currency";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCoupons = () => {
    setLoading(true);
    api
      .get("/coupons/admin/all")
      .then(({ data }) => setCoupons(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
    api.get("/categories/admin/all").then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const toggleActive = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      loadCoupons();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/coupons/${deleteTarget._id}`);
      toast.success("Coupon deleted");
      setDeleteTarget(null);
      loadCoupons();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Coupons</h1>
        <button
          onClick={() => { setEditingCoupon(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No coupons yet.</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-semibold text-ink">{c.code}</td>
                  <td className="px-4 py-3 text-ink">
                    {c.discountType === "percentage" ? `${c.discountValue}%` : `${formatMoney(c.discountValue)}`}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.usedCount} / {c.usageLimit ?? "∞"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(c.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        c.isActive && !isExpired(c.expiryDate) ? "bg-green-50 text-success" : "bg-slate-100 text-muted"
                      }`}
                    >
                      {isExpired(c.expiryDate) ? "Expired" : c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditingCoupon(c); setModalOpen(true); }} className="mr-2 text-muted hover:text-primary">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="text-muted hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CouponFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadCoupons(); }}
        editingCoupon={editingCoupon}
        categories={categories}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Are you sure you want to delete "${deleteTarget?.code}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}