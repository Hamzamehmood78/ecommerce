import { ShieldCheck, Truck, HeartHandshake, Sparkles } from "lucide-react";
import { STORE_NAME } from "../config";

const values = [
  { icon: Sparkles, title: "Quality First", text: "Every product is checked for quality before it reaches you." },
  { icon: Truck, title: "Fast Delivery", text: "We partner with trusted couriers to get your order to you quickly." },
  { icon: ShieldCheck, title: "Secure Shopping", text: "Your data and payments are protected at every step." },
  { icon: HeartHandshake, title: "Customer First", text: "Our support team is here to help, before and after your purchase." },
];

export default function AboutUs() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">About {STORE_NAME}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        {STORE_NAME} started with a simple idea: shopping online should be easy, honest, and enjoyable.
        We bring together quality products across fashion, electronics, and home essentials — all in one
        clean, simple store. From browsing to checkout to delivery, we focus on making every step smooth.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {values.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Icon size={24} className="text-primary" />
            <h3 className="mt-3 font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}