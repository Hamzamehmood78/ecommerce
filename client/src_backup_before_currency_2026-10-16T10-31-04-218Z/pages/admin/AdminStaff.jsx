import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import StaffFormModal from "../../components/admin/StaffFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { PERMISSION_OPTIONS } from "../../adminPermissions";

const labelFor = (key) => PERMISSION_OPTIONS.find((p) => p.key === key)?.label || key;

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStaff = () => {
    setLoading(true);
    api
      .get("/staff")
      .then(({ data }) => setStaff(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadStaff, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/staff/${deleteTarget._id}`);
      toast.success("Staff member removed");
      setDeleteTarget(null);
      loadStaff();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Staff & Roles</h1>
        <button
          onClick={() => { setEditingStaff(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-muted">No staff members yet. Add one to give limited admin access.</p>
        ) : (
          staff.map((member) => (
            <div key={member._id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="text-sm text-muted">{member.email}</p>
                </div>
                <div className="flex flex-shrink-0 gap-3">
                  <button onClick={() => { setEditingStaff(member); setModalOpen(true); }} className="text-muted hover:text-primary" aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget(member)} className="text-muted hover:text-danger" aria-label="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.permissions.length === 0 ? (
                  <span className="text-xs text-muted">No permissions assigned</span>
                ) : (
                  member.permissions.map((p) => (
                    <span key={p} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {labelFor(p)}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <StaffFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadStaff(); }}
        editingStaff={editingStaff}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Staff Member"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? They will no longer be able to log in.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}