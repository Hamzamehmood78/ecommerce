import { useEffect, useState } from "react";
import { Star, Check, X, MessageSquare, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    api
      .get("/reviews/admin/all")
      .then(({ data }) => setReviews(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadReviews, []);

  const handleModerate = async (id, isApproved) => {
    try {
      await api.put(`/reviews/${id}/moderate`, { isApproved });
      toast.success(isApproved ? "Review approved" : "Review rejected");
      loadReviews();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/reviews/${id}/reply`, { text: replyText });
      toast.success("Reply posted");
      setReplyingId(null);
      setReplyText("");
      loadReviews();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/reviews/${deleteTarget._id}`);
      toast.success("Review deleted");
      setDeleteTarget(null);
      loadReviews();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Reviews</h1>

      <div className="mt-5 space-y-4">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {review.user?.name} on <span className="text-primary">{review.product?.name}</span>
                  </p>
                  <div className="mt-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={13} className={n <= review.rating ? "fill-warning text-warning" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </div>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${review.isApproved ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>
                  {review.isApproved ? "Published" : "Hidden"}
                </span>
              </div>


              {review.images?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {review.images.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
                    >
                      <img src={url} alt="Review photo" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              {review.adminReply?.text && (
                <div className="mt-2 rounded-lg bg-surface p-2.5 text-sm text-muted">
                  <span className="font-medium text-ink">Store Reply: </span>{review.adminReply.text}
                </div>
              )}

              {replyingId === review._id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
                  />
                  <button onClick={() => handleReply(review._id)} className="rounded-lg bg-primary px-3 py-2 text-sm text-white">
                    Post
                  </button>
                  <button onClick={() => setReplyingId(null)} className="rounded-lg px-3 py-2 text-sm text-muted ring-1 ring-slate-200">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-4 text-xs font-medium">
                  {review.isApproved ? (
                    <button onClick={() => handleModerate(review._id, false)} className="flex items-center gap-1 text-danger">
                      <X size={14} /> Reject
                    </button>
                  ) : (
                    <button onClick={() => handleModerate(review._id, true)} className="flex items-center gap-1 text-success">
                      <Check size={14} /> Approve
                    </button>
                  )}
                  <button onClick={() => setReplyingId(review._id)} className="flex items-center gap-1 text-primary">
                    <MessageSquare size={14} /> Reply
                  </button>
                  <button onClick={() => setDeleteTarget(review)} className="flex items-center gap-1 text-muted hover:text-danger">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Review"
        message="Are you sure you want to delete this review? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}