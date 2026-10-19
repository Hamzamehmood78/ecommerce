import { Link } from "react-router-dom";
import { STORE_NAME } from "../../config";

const columns = [
  {
    title: "About",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "FAQs", to: "/faqs" },
      { label: "Shipping Policy", to: "/shipping-policy" },
      { label: "Return & Refund Policy", to: "/return-policy" },
      { label: "Track Order", to: "/track-order" },    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "My Orders", to: "/account/orders" },
      { label: "Wishlist", to: "/wishlist" },
    ],
  },
];

const paymentMethods = ["Visa", "Mastercard", "PayPal", "COD"];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-lg font-bold text-primary">{STORE_NAME}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Quality products, simple shopping and fast delivery, all in one
            place.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold text-ink">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
          </p>
          <div className="flex gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-slate-200"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}