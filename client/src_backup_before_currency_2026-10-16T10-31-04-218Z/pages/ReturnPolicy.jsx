import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ReturnPolicy() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setContent(data.policies?.returns || "")).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">Return & Refund Policy</h1>
      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : content ? (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{content}</p>
      ) : (
        <p className="mt-6 text-muted">
          You may request a return within 7 days of delivery for most items, provided they are unused
          and in original packaging. Refunds are processed within 5-7 business days after the returned
          item is received and inspected.
        </p>
      )}
    </div>
  );
}