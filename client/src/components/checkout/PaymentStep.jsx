import { Banknote, CreditCard, Wallet } from "lucide-react";
import StripeCardForm from "./StripeCardForm";

const paymentOptions = [
  { value: "cod", label: "Cash on Delivery", icon: Banknote, available: true },
  { value: "card", label: "Credit / Debit Card", icon: CreditCard, available: true },
  { value: "paypal", label: "PayPal", icon: Wallet, available: false },
];

export default function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  amount,
  deliveryMethod,
  couponCode,
  guest,
  onPaid,
  onNext,
  onBack,
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">Payment Method</h2>
      <div className="mt-4 space-y-3">
        {paymentOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <label
              key={opt.value}
              className={`flex items-center justify-between rounded-xl border p-4 transition ${
                !opt.available
                  ? "cursor-not-allowed border-slate-200 opacity-50"
                  : paymentMethod === opt.value
                  ? "cursor-pointer border-primary bg-primary/5"
                  : "cursor-pointer border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  disabled={!opt.available}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="h-4 w-4 accent-primary"
                />
                <Icon size={18} className="text-muted" />
                <span className="text-sm font-medium text-ink">{opt.label}</span>
              </div>
              {!opt.available && (
                <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                  Coming Soon
                </span>
              )}
            </label>
          );
        })}
      </div>

      {paymentMethod === "card" ? (
        <div className="mt-6">
          <StripeCardForm
            amount={amount}
            deliveryMethod={deliveryMethod}
            couponCode={couponCode}
            guest={guest}
            onPaid={onPaid}
            onBack={onBack}
          />
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="rounded-lg px-6 py-3 font-medium text-ink ring-1 ring-slate-200 transition hover:bg-surface"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark"
          >
            Review Order
          </button>
        </div>
      )}
    </div>
  );
}