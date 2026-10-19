import { useState } from "react";
import { Truck } from "lucide-react";

export default function DeliveryCheck() {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState(null);

  const handleCheck = (e) => {
    e.preventDefault();
    if (!zip.trim()) return;

    // Asli shipping-zone calculation Task 10/12 mein backend se aayega
    const days = 2 + (zip.length % 3);
    const date = new Date();
    date.setDate(date.getDate() + days);

    setResult({
      date: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      cod: true,
    });
  };

  return (
    <div className="rounded-xl bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <Truck size={18} className="text-primary" />
        Check Delivery
      </div>
      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter pincode / zip"
          className="flex-1 rounded-lg bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          Check
        </button>
      </form>

      {result && (
        <p className="mt-3 text-sm text-muted">
          Estimated delivery by <span className="font-medium text-ink">{result.date}</span>.{" "}
          {result.cod && <span className="text-success">Cash on Delivery available.</span>}
        </p>
      )}
    </div>
  );
}