import { useEffect, useState } from "react";
import { Star, ShieldCheck } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
export default function ProductTabs({ product }) {
    const [tab, setTab] = useState("description");
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [canReview, setCanReview] = useState(false);

    const loadReviews = () => {
        api.get(`/reviews/product/${product._id}`).then(({ data }) => setReviews(data)).catch(() => { });
    };

    useEffect(() => {
        loadReviews();
        if (user) {
            api
                .get(`/reviews/can-review/${product._id}`)
                .then(({ data }) => setCanReview(data.canReview))
                .catch(() => { });
        }
    }, [product._id, user]);

    const tabs = [
        { id: "description", label: "Description" },
        { id: "specs", label: "Specifications" },
        { id: "reviews", label: `Reviews (${reviews.length})` },
    ];

    return (
        <section className="mt-10">
            <div className="flex gap-6 border-b border-slate-200">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`border-b-2 pb-3 text-sm font-medium transition ${tab === t.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted hover:text-ink"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="py-6">
                {tab === "description" && (
                    <p className="max-w-3xl whitespace-pre-line leading-relaxed text-muted">
                        {product.description}
                    </p>
                )}

                {tab === "specs" && (
                    <table className="w-full max-w-xl text-sm">
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="py-2.5 font-medium text-ink">Brand</td>
                                <td className="py-2.5 text-muted">{product.brand || "—"}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                                <td className="py-2.5 font-medium text-ink">Category</td>
                                <td className="py-2.5 text-muted">{product.category?.name || "—"}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                                <td className="py-2.5 font-medium text-ink">SKU</td>
                                <td className="py-2.5 text-muted">{product.sku || "—"}</td>
                            </tr>
                            {product.sizes?.length > 0 && (
                                <tr className="border-b border-slate-100">
                                    <td className="py-2.5 font-medium text-ink">Available Sizes</td>
                                    <td className="py-2.5 text-muted">{product.sizes.join(", ")}</td>
                                </tr>
                            )}
                            {product.colors?.length > 0 && (
                                <tr className="border-b border-slate-100">
                                    <td className="py-2.5 font-medium text-ink">Available Colors</td>
                                    <td className="py-2.5 text-muted">{product.colors.join(", ")}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {tab === "reviews" && (
                    <div>
                        {reviews.length > 0 && (
                            <div className="mb-5 flex items-center gap-2">
                                <Star size={20} className="fill-warning text-warning" />
                                <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
                                <span className="text-sm text-muted">({reviews.length} reviews)</span>
                            </div>
                        )}

                        {canReview && (
                            <div className="mb-6">
                                <ReviewForm productId={product._id} onSubmitted={loadReviews} />
                            </div>
                        )}

                        {!canReview && (
                            <div className="mb-6 flex items-start gap-2 rounded-lg bg-surface p-4 text-sm text-muted">
                                <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-primary" />
                                Only customers who have purchased and received this product can write a review.
                            </div>
                        )}

                        <ReviewList reviews={reviews} onVoted={loadReviews} />
                    </div>
                )}
            </div>
        </section>
    );
}