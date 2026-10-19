import { useState } from "react";
import toast from "react-hot-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    // Backend endpoint Phase 2 mein banega, abhi sirf UI confirm karta hai
    setTimeout(() => {
      toast.success("Subscribed! Check your inbox for offers.");
      setEmail("");
      setSubmitting(false);
    }, 500);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-12">
        <h2 className="text-2xl font-bold">Subscribe & Get Offers</h2>
        <p className="mt-2 text-white/85">
          Be the first to know about new arrivals and exclusive discounts.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 rounded-lg px-4 py-2.5 text-ink outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
          >
            {submitting ? "..." : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}