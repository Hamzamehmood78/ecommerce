const stripe = require("../config/stripe");

// Paid order ka paisa wapas karta hai.
// Card se paid: Stripe se asli refund. COD (cash): sirf "refunded" mark hota hai,
// cash admin ko khud wapas karna hota hai.
// Stripe fail ho to error throw hota hai (taake order ki halat na badle).
const refundOrderPayment = async (order) => {
  if (!order.isPaid || order.isRefunded) return false;

  if (order.paymentMethod === "card" && order.paymentIntentId) {
    await stripe.refunds.create(
      { payment_intent: order.paymentIntentId },
      { idempotencyKey: `refund-${order._id}` } // dobara click par double refund nahi
    );
  }

  order.isRefunded = true;
  order.refundedAt = new Date();
  return true;
};

module.exports = { refundOrderPayment };