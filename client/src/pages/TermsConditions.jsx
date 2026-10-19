import { useEffect, useState } from "react";
import api from "../api/axios";

export default function TermsConditions() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setContent(data.policies?.terms || "")).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">Terms & Conditions</h1>
      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : content ? (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{content}</p>
      ) : (
        <p className="mt-6 text-muted">
          By using this website, you agree to purchase products for personal use, provide accurate
          information at checkout, and comply with our return and payment policies. We reserve the
          right to cancel orders in cases of suspected fraud or stock unavailability.
        </p>
      )}
    </div>
  );
}