import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Pencil, Trash2, Plus } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import AddressFormModal from "../../components/account/AddressFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get("/account/addresses")
      .then(({ data }) => setAddresses(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (list) => {
    setAddresses(list);
    setModalOpen(false);
  };

  const handleSetDefault = async (address) => {
    try {
      const { data } = await api.put(`/account/addresses/${address._id}/default`);
      setAddresses(data);
      toast.success("Default address updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/account/addresses/${deleteTarget._id}`);
      setAddresses(data);
      toast.success("Address deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">My Addresses</h2>
        <button
          onClick={() => { setEditingAddress(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add New Address
        </button>
      </div>

      {loading ? (
        <div className="mt-5 h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : addresses.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl bg-surface px-6 py-12 text-center">
          <MapPin size={40} className="text-muted" />
          <p className="mt-3 font-medium text-ink">No saved addresses yet</p>
          <p className="mt-1 text-sm text-muted">Save an address to check out faster next time.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className={`rounded-xl p-4 ring-1 ${a.isDefault ? "ring-primary bg-primary/5" : "ring-slate-200"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{a.fullName}</p>
                {a.isDefault && (
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white">Default</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">{a.phone}</p>
              <p className="mt-1 text-sm text-muted">
                {a.addressLine1}{a.addressLine2 && `, ${a.addressLine2}`}
                <br />
                {a.city}{a.state && `, ${a.state}`} - {a.zip}
              </p>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <button
                  onClick={() => { setEditingAddress(a); setModalOpen(true); }}
                  className="flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(a)}
                  className="flex items-center gap-1 font-medium text-muted hover:text-danger"
                >
                  <Trash2 size={14} /> Delete
                </button>
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(a)} className="ml-auto font-medium text-muted hover:text-primary">
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editingAddress={editingAddress}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}