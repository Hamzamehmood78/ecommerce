import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import BannerFormModal from "../../components/admin/BannerFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBanners = () => {
    setLoading(true);
    api
      .get("/banners/admin/all")
      .then(({ data }) => setBanners(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadBanners, []);

  const toggleActive = async (banner) => {
    try {
      await api.put(`/banners/${banner._id}`, { isActive: !banner.isActive });
      loadBanners();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const move = async (index, direction) => {
    const newList = [...banners];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setBanners(newList);
    try {
      await api.put("/banners/reorder", { orderedIds: newList.map((b) => b._id) });
    } catch (err) {
      toast.error(getErrorMessage(err));
      loadBanners();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/banners/${deleteTarget._id}`);
      toast.success("Banner deleted");
      setDeleteTarget(null);
      loadBanners();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Homepage Banners</h1>
        <button
          onClick={() => { setEditingBanner(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">Drag order with the arrows — this is the order shown on the homepage slider.</p>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : banners.length === 0 ? (
          <p className="text-muted">No banners yet. Add one to populate the homepage slider.</p>
        ) : (
          banners.map((banner, i) => (
            <div key={banner._id} className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted hover:text-primary disabled:opacity-30">
                  <ArrowUp size={16} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="text-muted hover:text-primary disabled:opacity-30">
                  <ArrowDown size={16} />
                </button>
              </div>

              <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg">
                <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{banner.heading}</p>
                <p className="truncate text-xs text-muted">{banner.subtext}</p>
              </div>

              <button
                onClick={() => toggleActive(banner)}
                className={`flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  banner.isActive ? "bg-green-50 text-success" : "bg-slate-100 text-muted"
                }`}
              >
                {banner.isActive ? "Active" : "Hidden"}
              </button>

              <button onClick={() => { setEditingBanner(banner); setModalOpen(true); }} className="flex-shrink-0 text-muted hover:text-primary">
                <Pencil size={16} />
              </button>
              <button onClick={() => setDeleteTarget(banner)} className="flex-shrink-0 text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <BannerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadBanners(); }}
        editingBanner={editingBanner}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteTarget?.heading}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}