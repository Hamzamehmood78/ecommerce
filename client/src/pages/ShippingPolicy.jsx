import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ShippingPolicy() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setContent(data.policies?.shipping || "")).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">Shipping Policy</h1>
      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : content ? (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{content}</p>
      ) : (
        <p className="mt-6 text-muted">
          Orders are processed within 1-2 business days. Standard delivery takes 3-5 business days,
          and Express delivery takes 1-2 business days. Free shipping is available on larger orders. The amount is shown in your cart and at checkout.
        </p>
      )}
    </div>
  );
}