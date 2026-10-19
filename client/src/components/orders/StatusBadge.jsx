const styles = {
  pending: "bg-amber-50 text-warning ring-amber-200",
  processing: "bg-blue-50 text-info ring-blue-200",
  shipped: "bg-blue-50 text-info ring-blue-200",
  out_for_delivery: "bg-blue-50 text-info ring-blue-200",
  delivered: "bg-green-50 text-success ring-green-200",
  cancelled: "bg-red-50 text-danger ring-red-200",
  returned: "bg-red-50 text-danger ring-red-200",
};

const labels = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
        styles[status] || "bg-surface text-muted ring-slate-200"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}