export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const PRESETS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// Preset ka { from, to } (aaj ke din tak). Hafta Monday se shuru hota hai.
export const rangeForPreset = (key, now = new Date()) => {
  const end = endOfDay(now);

  if (key === "today") return { from: startOfDay(now), to: end };

  if (key === "week") {
    const daysSinceMonday = (now.getDay() + 6) % 7;
    const start = startOfDay(now);
    start.setDate(start.getDate() - daysSinceMonday);
    return { from: start, to: end };
  }

  if (key === "year") return { from: new Date(now.getFullYear(), 0, 1), to: end };

  // month (default)
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: end };
};

// <input type="date"> ke liye "YYYY-MM-DD" (apne local waqt mein)
export const toInputDate = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

export const fromInputDate = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatRangeDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });