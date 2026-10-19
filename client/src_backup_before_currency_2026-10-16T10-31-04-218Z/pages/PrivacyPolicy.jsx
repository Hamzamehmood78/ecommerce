import { useEffect, useState } from "react";
import api from "../api/axios";

export default function PrivacyPolicy() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setContent(data.policies?.privacy || "")).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">Privacy Policy</h1>
      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : content ? (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{content}</p>
      ) : (
        <p className="mt-6 text-muted">
          We collect only the information needed to process your orders — your name, address, phone
          number, and email. We never sell your data to third parties. Payment details are handled
          securely and are never stored on our servers.
        </p>
      )}
    </div>
  );
}