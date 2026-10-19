export default function SimpleBarChart({ data, labelKey, valueKey, formatValue }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);

  if (data.length === 0) {
    return <p className="text-sm text-muted">No data for this period.</p>;
  }

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 flex-shrink-0 truncate text-xs text-muted">{item[labelKey]}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((item[valueKey] / max) * 100, 2)}%` }}
            />
          </div>
          <span className="w-20 flex-shrink-0 text-right text-xs font-medium text-ink">
            {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}