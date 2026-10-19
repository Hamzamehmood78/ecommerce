import { formatMoney } from "../../utils/currency";
export default function ReviewStep({
  address,
  deliveryMethod,
  paymentMethod,
  items,
  itemsPrice,
  shippingPrice,
  discountAmount = 0,
  couponCode,
  taxPrice = 0,
  taxLabel = "Tax",
  taxRate = 0,
  onBack,
  onPlaceOrder,
  placing,
}) {
  const total = Math.max(itemsPrice - discountAmount, 0) + shippingPrice + taxPrice;

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">Review & Place Order</h2>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl bg-surface p-4">
          <h3 className="text-sm font-semibold text-ink">Shipping Address</h3>
          <p className="mt-1 text-sm text-muted">
            {address.fullName}, {address.phone}
            <br />
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
            <br />
            {address.city}
            {address.state && `, ${address.state}`} - {address.zip}
          </p>
        </div>

        <div className="rounded-xl bg-surface p-4">
          <h3 className="text-sm font-semibold text-ink">Delivery & Payment</h3>
          <p className="mt-1 text-sm capitalize text-muted">
            {deliveryMethod} delivery • {paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <h3 className="mb-3 text-sm font-semibold text-ink">Items ({items.length})</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.itemId} className="flex items-center gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.product?.images?.[0] && (
                    <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-ink">{item.product?.name}</p>
                  <p className="text-muted">
                    Qty: {item.quantity}
                    {item.size && ` • Size: ${item.size}`}
                    {item.color && ` • Color: ${item.color}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatMoney(itemsPrice)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount {couponCode && `(${couponCode})`}</span>
                <span>- {formatMoney(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>{shippingPrice === 0 ? "Free" : `${formatMoney(shippingPrice)}`}</span>
            </div>
            {taxPrice > 0 && (
              <div className="flex justify-between text-muted">
                <span>
                  {taxLabel} ({taxRate}%)
                </span>
                <span>{formatMoney(taxPrice)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          disabled={placing}
          className="rounded-lg px-6 py-3 font-medium text-ink ring-1 ring-slate-200 transition hover:bg-surface disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onPlaceOrder}
          disabled={placing}
          className="flex-1 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {placing ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}