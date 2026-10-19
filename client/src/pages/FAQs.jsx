import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How long does delivery take?", a: "Standard delivery takes 3-5 business days, and Express delivery takes 1-2 business days." },
  { q: "What payment methods do you accept?", a: "We currently accept Cash on Delivery (COD). Card and PayPal payments are coming soon." },
  { q: "Can I cancel my order?", a: "Yes, you can cancel your order from My Orders as long as it's still Pending or Processing." },
  { q: "How do I track my order?", a: "Go to My Orders and click on any order to see its live status and tracking details." },
  { q: "What is your return policy?", a: "You can request a return within the return window after delivery. See our Return & Refund Policy for details." },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-ink">Frequently Asked Questions</h1>

      <div className="mt-8 space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-medium text-ink">{faq.q}</span>
              <ChevronDown size={18} className={`text-muted transition ${openIndex === i ? "rotate-180" : ""}`} />
            </button>
            {openIndex === i && <p className="px-5 pb-4 text-sm text-muted">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}