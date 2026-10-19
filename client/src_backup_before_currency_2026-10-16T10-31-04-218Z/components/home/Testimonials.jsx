import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import api from "../../api/axios";

// Mobile par 1, tablet par 2, bare screen par 3 reviews nazar aate hain
const visibilityClass = ["", "hidden sm:block", "hidden lg:block"];

export default function Testimonials() {
  const [reviews, setReviews] = useState(null);
  const [start, setStart] = useState(0);

  useEffect(() => {
    api
      .get("/reviews/featured")
      .then(({ data }) => setReviews(data))
      .catch(() => setReviews([]));
  }, []);

  // Asli reviews na hon to yeh hissa dikhana hi nahi (jhoote reviews nahi)
  if (!reviews || reviews.length === 0) return null;

  const count = Math.min(3, reviews.length);
  const shown = Array.from({ length: count }, (_, i) => reviews[(start + i) % reviews.length]);
  const move = (delta) => setStart((s) => (s + delta + reviews.length) % reviews.length);
  const arrowClass = reviews.length > 3 ? "" : "lg:hidden";

  return (
    <section className="bg-surface py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">What Our Customers Say</h2>
          {reviews.length > 1 && (
            <div className={`flex gap-2 ${arrowClass}`}>
              <button
                onClick={() => move(-1)}
                aria-label="Previous reviews"
                className="rounded-full bg-white p-2 text-ink shadow-sm ring-1 ring-slate-200 hover:text-primary"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => move(1)}
                aria-label="Next reviews"
                className="rounded-full bg-white p-2 text-ink shadow-sm ring-1 ring-slate-200 hover:text-primary"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r, i) => (
            <div
              key={r._id}
              className={`flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${visibilityClass[i]}`}
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    className={n <= r.rating ? "fill-warning text-warning" : "fill-slate-200 text-slate-200"}
                  />
                ))}
              </div>

              <p className="mt-3 flex-1 text-sm text-muted">"{r.comment}"</p>

              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {r.name}
                  {r.isVerifiedPurchase && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                      <BadgeCheck size={13} /> Verified
                    </span>
                  )}
                </p>
                {r.productSlug && (
                  <Link to={`/product/${r.productSlug}`} className="text-xs text-primary hover:underline">
                    on {r.productName}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}