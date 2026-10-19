import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import useCountdown from "../../hooks/useCountdown";

// Har din raat 12 baje reset ho jata hai
function getEndOfDay() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function TimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-white/20 px-3 py-1.5">
      <span className="text-lg font-bold text-white">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase text-white/80">{label}</span>
    </div>
  );
}

export default function DealOfTheDay({ products, loading }) {
  const { hours, minutes, seconds } = useCountdown(getEndOfDay());

  if (!loading && products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-gradient-to-r from-accent to-accent-dark px-5 py-4">
        <h2 className="text-xl font-bold text-white">🔥 Deal of the Day</h2>
        <div className="flex gap-2">
          <TimeBox value={hours} label="hrs" />
          <TimeBox value={minutes} label="min" />
          <TimeBox value={seconds} label="sec" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-b-xl bg-orange-50 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white p-3">
                <div className="aspect-square rounded-lg bg-slate-200" />
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
              </div>
            ))
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}