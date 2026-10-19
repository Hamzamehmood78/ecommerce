import { formatMoney } from "../../utils/currency";
const compact = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
};

// "2026-10-12" -> "Oct 12", "2026-10" -> "Oct 2026"
const formatLabel = (label) => {
  if (label.length === 7) {
    return new Date(`${label}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return new Date(`${label}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

export default function RevenueChart({ data }) {
  const total = (data || []).reduce((sum, d) => sum + d.revenue, 0);
  if (!data || data.length === 0 || total === 0) {
    return <p className="py-12 text-center text-sm text-muted">No sales in this period.</p>;
  }

  const width = 640;
  const height = 240;
  const pad = { top: 12, right: 8, bottom: 30, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(...data.map((d) => d.revenue));
  const slot = innerW / data.length;
  const barW = Math.max(Math.min(slot * 0.7, 40), 2);
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Revenue chart">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.top + innerH - t * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#E2E8F0" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#52606D">
              {compact(Math.round(max * t))}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const h = (d.revenue / max) * innerH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        const y = pad.top + innerH - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx="2" fill="#0F766E">
              <title>
                {`${formatLabel(d.label)}: ${formatMoney(d.revenue)} (${d.orders} order${d.orders === 1 ? "" : "s"})`}
              </title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={pad.left + i * slot + slot / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="#52606D">
                {formatLabel(d.label)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}