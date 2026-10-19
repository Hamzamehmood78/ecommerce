import { useState } from "react";
import {
  PRESETS,
  rangeForPreset,
  startOfDay,
  endOfDay,
  toInputDate,
  fromInputDate,
} from "../../utils/dateRanges.js";

export default function DateRangeFilter({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(value.key === "custom");
  const [customFrom, setCustomFrom] = useState(toInputDate(value.from));
  const [customTo, setCustomTo] = useState(toInputDate(value.to));
  const [error, setError] = useState("");

  const choosePreset = (key) => {
    setShowCustom(false);
    setError("");
    onChange({ key, ...rangeForPreset(key) });
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) {
      setError("Please select both dates");
      return;
    }
    const from = startOfDay(fromInputDate(customFrom));
    const to = endOfDay(fromInputDate(customTo));
    if (from > to) {
      setError("Start date must be before the end date");
      return;
    }
    setError("");
    onChange({ key: "custom", from, to });
  };

  const buttonClass = (active) =>
    `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-slate-200 hover:text-ink"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => choosePreset(p.key)}
            className={buttonClass(!showCustom && value.key === p.key)}
          >
            {p.label}
          </button>
        ))}
        <button onClick={() => setShowCustom(true)} className={buttonClass(showCustom)}>
          Custom Range
        </button>
      </div>

      {showCustom && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-muted">to</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={applyCustom}
            className="rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Apply
          </button>
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      )}
    </div>
  );
}