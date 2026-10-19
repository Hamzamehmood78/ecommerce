import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMessages = () => {
    setLoading(true);
    api.get("/contact/admin/all").then(({ data }) => setMessages(data)).finally(() => setLoading(false));
  };

  useEffect(loadMessages, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/contact/${id}/read`);
      loadMessages();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/contact/${deleteTarget._id}`);
      toast.success("Message deleted");
      setDeleteTarget(null);
      loadMessages();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">
        Contact Messages {unreadCount > 0 && <span className="text-base font-normal text-danger">({unreadCount} unread)</span>}
      </h1>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-muted">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`rounded-xl p-4 shadow-sm ring-1 ${msg.isRead ? "bg-white ring-slate-200" : "bg-primary/5 ring-primary/20"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{msg.subject}</p>
                  <p className="text-xs text-muted">{msg.name} • {msg.email}</p>
                </div>
                <span className="text-xs text-muted">
                  {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{msg.message}</p>
              <div className="mt-3 flex gap-4 text-xs font-medium">
                {!msg.isRead && (
                  <button onClick={() => handleMarkRead(msg._id)} className="flex items-center gap-1 text-primary">
                    <MailOpen size={14} /> Mark as Read
                  </button>
                )}
                <button onClick={() => setDeleteTarget(msg)} className="flex items-center gap-1 text-muted hover:text-danger">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}