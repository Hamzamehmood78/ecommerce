import { Link } from "react-router-dom";

// Sirf live demo par (VITE_DEMO_MODE=true) dikhta hai, apne computer par nahi
export default function DemoBanner() {
  if (import.meta.env.VITE_DEMO_MODE !== "true") return null;

  return (
    <div className="bg-ink px-4 py-2 text-center text-xs text-white">
      <span className="font-semibold">Portfolio demo store.</span> No real orders or payments. Test card:{" "}
      <span className="font-mono">4242 4242 4242 4242</span> (any future date, any CVC).{" "}
      <Link to="/admin/login" className="font-semibold underline underline-offset-2 hover:text-accent">
        Admin panel demo →
      </Link>
    </div>
  );
}