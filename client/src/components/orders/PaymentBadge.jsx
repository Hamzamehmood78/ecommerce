export const paymentStatusOf = (order) => {
  if (order.isRefunded) return { text: "Refunded", cls: "bg-red-50 text-danger" };
  if (order.isPaid) return { text: "Paid", cls: "bg-green-50 text-success" };
  return {
    text: order.paymentMethod === "cod" ? "Unpaid (COD)" : "Unpaid",
    cls: "bg-amber-50 text-warning",
  };
};

export default function PaymentBadge({ order }) {
  const status = paymentStatusOf(order);
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
      {status.text}
    </span>
  );
}