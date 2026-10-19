import { Truck, ShieldCheck, RotateCcw, Headset } from "lucide-react";

const items = [
  { icon: Truck, label: "Free Shipping" },
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: Headset, label: "24/7 Support" },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white py-6">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
            <Icon size={20} className="text-primary" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}