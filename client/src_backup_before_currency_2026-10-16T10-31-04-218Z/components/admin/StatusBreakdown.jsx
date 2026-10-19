const colors = {
  pending: "#D97706",
  processing: "#2563EB",
  shipped: "#6366F1",
  out_for_delivery: "#0891B2",
  delivered: "#16A34A",
  cancelled: "#DC2626",
  returned: "#9F1239",
};

export default function StatusBreakdown({ data }) {
  const total = (data || []).reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <p className="py-12 text-center text-sm text-muted">No orders in this period.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const percent = Math.round((d.count / total) * 100);
        return (
          <div key={d.status}>
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize text-ink">{d.status.replace(/_/g, " ")}</span>
              <span className="text-muted">
                <span className="font-semibold text-ink">{d.count}</span> ({percent}%)
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.count === 0 ? 0 : Math.max(percent, 2)}%`, backgroundColor: colors[d.status] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}