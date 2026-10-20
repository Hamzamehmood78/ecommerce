import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import useStoreInfo from "../../hooks/useStoreInfo";

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
      { label: "Track Order", to: "/track-order" },
    ],
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
  const store = useStoreInfo();

  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-lg font-bold text-primary">{store.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Quality products, simple shopping and fast delivery, all in one place.
          </p>

          {(store.email || store.phone || store.address) && (
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              {store.email && (
                <li className="flex items-start gap-2">
                  <Mail size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                  <span className="break-all">{store.email}</span>
                </li>
              )}
              {store.phone && (
                <li className="flex items-start gap-2">
                  <Phone size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                  <span>{store.phone}</span>
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                  <span>{store.address}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold text-ink">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted transition hover:text-primary">
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
            © {new Date().getFullYear()} {store.name}. All rights reserved.
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