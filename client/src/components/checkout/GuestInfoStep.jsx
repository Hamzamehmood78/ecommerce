import { Link } from "react-router-dom";
import AuthInput from "../auth/AuthInput";

export default function GuestInfoStep({ info, setInfo, errors, checking, onNext }) {
  const handleChange = (field) => (e) => setInfo({ ...info, [field]: e.target.value });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Contact & Shipping Address</h2>
        <p className="text-sm text-muted">
          Have an account?{" "}
          <Link to="/login" state={{ from: "/checkout" }} className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">You're checking out as a guest. No account is needed.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AuthInput
            label="Email (we'll send your order updates here)"
            type="email"
            value={info.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          {errors.emailExists && (
            <Link
              to="/login"
              state={{ from: "/checkout" }}
              className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Log in to continue →
            </Link>
          )}
        </div>
        <AuthInput label="Full Name" value={info.fullName} onChange={handleChange("fullName")} error={errors.fullName} />
        <AuthInput label="Phone" value={info.phone} onChange={handleChange("phone")} error={errors.phone} />
        <div className="sm:col-span-2">
          <AuthInput
            label="Address Line 1"
            value={info.addressLine1}
            onChange={handleChange("addressLine1")}
            error={errors.addressLine1}
          />
        </div>
        <div className="sm:col-span-2">
          <AuthInput
            label="Address Line 2 (optional)"
            value={info.addressLine2}
            onChange={handleChange("addressLine2")}
          />
        </div>
        <AuthInput label="City" value={info.city} onChange={handleChange("city")} error={errors.city} />
        <AuthInput label="State / Province (optional)" value={info.state} onChange={handleChange("state")} />
        <AuthInput label="Zip / Postal Code" value={info.zip} onChange={handleChange("zip")} error={errors.zip} />
      </div>

      <button
        onClick={onNext}
        disabled={checking}
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {checking ? "Checking..." : "Continue to Delivery"}
      </button>
    </div>
  );
}