import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import DemoBanner from "./DemoBanner";
import ServerWakeNotice from "./ServerWakeNotice";
import useDocumentMeta from "../../hooks/useDocumentMeta";

// Seedhe pate wale pages ke title
const PAGE_META = {
  "/about": { title: "About Us" },
  "/contact": { title: "Contact Us" },
  "/faqs": { title: "FAQs" },
  "/shipping-policy": { title: "Shipping Policy" },
  "/return-policy": { title: "Return & Refund Policy" },
  "/privacy-policy": { title: "Privacy Policy" },
  "/terms-conditions": { title: "Terms & Conditions" },
  "/track-order": { title: "Track Your Order" },
  "/cart": { title: "Shopping Cart", noindex: true },
  "/checkout": { title: "Checkout", noindex: true },
  "/wishlist": { title: "My Wishlist", noindex: true },
  "/login": { title: "Login", noindex: true },
  "/register": { title: "Create Account", noindex: true },
  "/forgot-password": { title: "Forgot Password", noindex: true },
};

// Jin pages ka shuruaati hissa tay hai (private pages, search engine se chhupe)
const PRIVATE_PREFIXES = [
  { prefix: "/account", title: "My Account" },
  { prefix: "/order-confirmation", title: "Order Confirmation" },
  { prefix: "/reset-password", title: "Reset Password" },
];

const metaFor = (pathname) => {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = PRIVATE_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  return match ? { title: match.title, noindex: true } : {};
};

export default function Layout() {
  const { pathname } = useLocation();

  // Home, Shop aur Product page apna title khud set karte hain
  const selfManaged = pathname === "/" || pathname === "/shop" || pathname.startsWith("/product/");
  useDocumentMeta({ ...metaFor(pathname), disabled: selfManaged });

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ServerWakeNotice />
    </div>
  );
}