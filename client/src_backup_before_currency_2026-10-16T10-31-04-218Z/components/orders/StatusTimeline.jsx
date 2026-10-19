import { Check, X } from "lucide-react";

const flowSteps = [
  { key: "pending", label: "Order Placed" },
  { key: "processing", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function StatusTimeline({ status }) {
  if (status === "cancelled" || status === "returned") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-danger text-white">
          <X size={16} />
        </div>
        <p className="text-sm font-medium text-danger">
          This order was {status === "cancelled" ? "cancelled" : "returned"}.
        </p>
      </div>
    );
  }

  const currentIndex = flowSteps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start">
      {flowSteps.map((step, i) => {
        const isDone = i <= currentIndex;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div className={`h-0.5 flex-1 ${i <= currentIndex ? "bg-primary" : "bg-slate-200"}`} />
              )}
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  isDone ? "bg-primary text-white" : "bg-surface text-muted ring-1 ring-slate-200"
                }`}
              >
                {isDone && <Check size={14} />}
              </div>
              {i < flowSteps.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < currentIndex ? "bg-primary" : "bg-slate-200"}`} />
              )}
            </div>
            <span className={`mt-2 max-w-20 text-center text-xs font-medium ${isDone ? "text-ink" : "text-muted"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}