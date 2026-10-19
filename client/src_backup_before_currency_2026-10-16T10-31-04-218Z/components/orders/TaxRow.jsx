// Order ke totals mein "Tax (17%)" ki line. Tax na laga ho (ya purana order ho) to kuch nahi dikhata.
export default function TaxRow({ order }) {
  if (!order.taxPrice || order.taxPrice <= 0) return null;

  return (
    <div className="flex justify-between text-muted">
      <span>
        {order.taxLabel || "Tax"} ({order.taxRate}%)
      </span>
      <span>Rs {order.taxPrice.toLocaleString()}</span>
    </div>
  );
}