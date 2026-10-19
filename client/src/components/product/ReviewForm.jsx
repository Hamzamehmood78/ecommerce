import { useRef, useState } from "react";
import { Star, ImagePlus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";

const MAX_PHOTOS = 3;
const MAX_SIZE_MB = 5;

export default function ReviewForm({ productId, onSubmitted }) {
  const fileRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileRef.current) fileRef.current.value = "";
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    if (files.some((f) => !f.type.startsWith("image/"))) {
      toast.error("Only image files are allowed");
      return;
    }
    if (files.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      toast.error(`Each photo must be smaller than ${MAX_SIZE_MB} MB`);
      return;
    }

    const formData = new FormData();
    formData.append("productId", productId); // files se pehle
    files.forEach((file) => formData.append("images", file));

    setUploading(true);
    try {
      const { data } = await api.post("/upload/review", formData);
      setPhotos((prev) => [...prev, ...data.urls]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/reviews", { productId, rating, comment, images: photos });
      toast.success("Review submitted. Thank you!");
      setRating(0);
      setComment("");
      setPhotos([]);
      onSubmitted();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-surface p-4">
      <h4 className="text-sm font-semibold text-ink">Write a Review</h4>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${star} star`}
          >
            <Star
              size={24}
              className={
                star <= (hoverRating || rating)
                  ? "fill-warning text-warning"
                  : "fill-slate-200 text-slate-200"
              }
            />
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product..."
        className="mt-3 w-full rounded-lg bg-white px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
      />

      <div className="mt-3">
        <p className="text-xs font-medium text-muted">Photos (optional, up to {MAX_PHOTOS})</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((url) => (
            <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <img src={url} alt="Review photo" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              <span className="text-[10px]">{uploading ? "Uploading" : "Add photo"}</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}