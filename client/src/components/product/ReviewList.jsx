import { useEffect, useState } from "react";
import { Star, ThumbsUp, BadgeCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function ReviewList({ reviews, onVoted }) {
  const { user } = useAuth();
  const [votingId, setVotingId] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Escape se bari tasveer band
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => e.key === "Escape" && setLightbox(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    setVotingId(reviewId);
    try {
      await api.put(`/reviews/${reviewId}/helpful`);
      onVoted();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setVotingId(null);
    }
  };

  if (reviews.length === 0) {
    return <p className="text-sm text-muted">No reviews yet. Be the first to review this product.</p>;
  }

  return (
    <>
      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review._id} className="border-b border-slate-100 pb-5 last:border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{review.user?.name || "Anonymous"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        className={n <= review.rating ? "fill-warning text-warning" : "fill-slate-200 text-slate-200"}
                      />
                    ))}
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <BadgeCheck size={13} /> Verified Purchase
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted">
                {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted">{review.comment}</p>

            {review.images?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.images.map((url) => (
                  <button
                    key={url}
                    onClick={() => setLightbox(url)}
                    aria-label="View review photo"
                    className="h-20 w-20 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 transition hover:ring-primary"
                  >
                    <img src={url} alt="Review photo" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {review.adminReply?.text && (
              <div className="mt-3 rounded-lg bg-surface p-3">
                <p className="text-xs font-semibold text-primary">Store Reply</p>
                <p className="mt-1 text-sm text-muted">{review.adminReply.text}</p>
              </div>
            )}

            <button
              onClick={() => handleHelpful(review._id)}
              disabled={votingId === review._id}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary disabled:opacity-60"
            >
              <ThumbsUp size={14} /> Helpful ({review.helpfulVotes?.length || 0})
            </button>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setLightbox(null)} />
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-ink shadow"
          >
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt="Review photo"
            className="relative max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}