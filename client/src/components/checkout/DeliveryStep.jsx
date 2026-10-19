import { formatMoney } from "../../utils/currency";
export default function DeliveryStep({ deliveryMethod, setDeliveryMethod, rates, onNext, onBack }) {
  const options = [
    { value: "standard", label: rates?.standard?.label || "Standard (3-5 days)", price: rates?.standard?.price ?? 200 },
    { value: "express", label: rates?.express?.label || "Express (1-2 days)", price: rates?.express?.price ?? 450 },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">Delivery Method</h2>
      <div className="mt-4 space-y-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
              deliveryMethod === opt.value ? "border-primary bg-primary/5" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="delivery"
                checked={deliveryMethod === opt.value}
                onChange={() => setDeliveryMethod(opt.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium text-ink">{opt.label}</span>
            </div>
            <span className="text-sm font-semibold text-ink">{formatMoney(opt.price)}</span>
          </label>
        ))}
      </div>

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
          Continue to Payment
        </button>
      </div>
    </div>
  );
}