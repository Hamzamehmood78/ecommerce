import { Check } from "lucide-react";

const steps = ["Address", "Delivery", "Payment", "Review"];

export default function StepIndicator({ current }) {
  return (
    <div className="mb-8 flex items-center">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isDone
                    ? "bg-primary text-white"
                    : isActive
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-surface text-muted ring-1 ring-slate-200"
                }`}
              >
                {isDone ? <Check size={16} /> : stepNum}
              </div>
              <span className={`mt-1.5 text-xs font-medium ${isActive ? "text-primary" : "text-muted"}`}>
                {label}
              </span>
            </div>
            {stepNum < steps.length && (
              <div className={`mx-2 h-0.5 flex-1 ${isDone ? "bg-primary" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}