const Order = require("../models/Order");
const User = require("../models/User");
const stripe = require("../config/stripe");
const { changeStock } = require("../utils/stockLog");
const { notifyUser, notifyStaff } = require("../utils/notify");
const { sendTemplatedEmail } = require("../utils/emailTemplates");
const { computeOrderTotals, getShippingConfig } = require("../utils/pricing");
const { checkGuestEmail, getOrCreateGuest } = require("../utils/guest");
const { formatMoney } = require("../utils/currency");

const emailRegex = /^\S+@\S+\.\S+$/;
const REQUIRED_ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "city", "zip"];

const isStripeError = (error) => typeof error?.type === "string" && error.type.startsWith("Stripe");
const shortIdOf = (order) => order._id.toString().slice(-8).toUpperCase();

const missingAddressField = (address) =>
  REQUIRED_ADDRESS_FIELDS.find((field) => !String(address?.[field] ?? "").trim());

const cleanAddress = (address) => ({
  fullName: String(address.fullName).trim(),
  phone: String(address.phone).trim(),
  addressLine1: String(address.addressLine1).trim(),
  addressLine2: String(address.addressLine2 || "").trim(),
  city: String(address.city).trim(),
  state: String(address.state || "").trim(),
  zip: String(address.zip).trim(),
});

// Payment wapas karne ki koshish (fail ho to sirf log, taake asal jawab na ruke)
const refundPaymentIntent = async (paymentIntentId, keyPrefix) => {
  try {
    await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `${keyPrefix}-${paymentIntentId}` }
    );
    return true;
  } catch (error) {
    console.error("Automatic refund failed:", error.message);
    return false;
  }
};

// Card ki payment ki jaanch. owner = { userId } (customer) ya { guestEmail } (guest).
// Payment usi ki honi chahiye, raqam order ke total ke barabar, aur pehle istemal na hui ho.
const verifyCardPayment = async ({ paymentIntentId, totalPrice, currency, owner }) => {  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return { error: { status: 400, message: "Payment was not completed" } };
  }

  if (await Order.exists({ paymentIntentId })) {
    return { error: { status: 400, message: "This payment has already been used for an order" } };
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    if (isStripeError(error)) {
      return { error: { status: 400, message: "We could not verify your payment" } };
    }
    throw error;
  }

  if (paymentIntent.status !== "succeeded") {
    return { error: { status: 400, message: "Payment has not succeeded yet" } };
  }

  const meta = paymentIntent.metadata || {};
  const belongsToOwner = ["userId", "guestEmail"].every(
    (key) => (meta[key] || "") === (owner[key] || "")
  );
  if (!belongsToOwner) {
    return { error: { status: 403, message: "This payment does not belong to your account" } };
  }
  // Payment usi currency mein honi chahiye jis mein store chal raha hai
  if (currency && String(paymentIntent.currency).toLowerCase() !== currency.toLowerCase()) {
    return {
      error: { status: 400, message: "This payment was made in a different currency. Please pay again." },
    };
  }
  // Total payment ke baad badal gaya (jaise qeemat badli): paisa wapas
  if (paymentIntent.amount !== Math.round(totalPrice * 100)) {
    const refunded = await refundPaymentIntent(paymentIntentId, "mismatch");
    return {
      error: {
        status: 409,
        message: refunded
          ? "Your order total changed after payment, so your payment has been refunded. Please review your cart and try again."
          : "Your order total changed after payment. Please contact support so we can refund you.",
      },
    };
  }

  return {};
};

// Order banane ke baad ke sab kaam (customer aur guest dono ke liye ek jaise)
const finalizeOrder = async ({
  owner,
  totals,
  shippingAddress,
  deliveryMethod,
  paymentMethod,
  paymentIntentId,
  isPaid,
  paidAt,
}) => {
  const order = await Order.create({
    user: owner._id,
    items: totals.orderItems,
    shippingAddress: cleanAddress(shippingAddress),
    deliveryMethod,
    paymentMethod,
    paymentIntentId: paymentMethod === "card" ? paymentIntentId : "",
    isPaid,
    paidAt,
    itemsPrice: totals.itemsPrice,
    shippingPrice: totals.shippingPrice,
    discountAmount: totals.discountAmount,
    couponCode: totals.coupon ? totals.coupon.code : "",
    taxPrice: totals.taxPrice,
    taxRate: totals.taxRate,
    taxLabel: totals.taxLabel,
totalPrice: totals.totalPrice, currency: totals.currency,
  });

  const shortId = shortIdOf(order);

  // Stock kam karo aur sold count badhao (stock history mein bhi darj hota hai)
  for (const item of totals.orderItems) {
    await changeStock(item.product, -item.quantity, {
      reason: `Order placed (#${shortId})`,
      source: "order",
      user: owner._id,
      soldDelta: item.quantity,
    });
  }

  // Coupon ka istemal darj karo
  if (totals.coupon) {
    const coupon = totals.coupon;
    coupon.usedCount += 1;
    const userUsage = coupon.usedBy.find((u) => u.user.toString() === owner._id.toString());
    if (userUsage) userUsage.count += 1;
    else coupon.usedBy.push({ user: owner._id, count: 1 });
    await coupon.save();
  }

  // Database ka cart khali karo (guest ka cart browser mein hota hai)
  if (totals.cart) {
    totals.cart.items = [];
    await totals.cart.save();
  }

  sendTemplatedEmail("order_placed", order, owner);

  notifyUser(owner._id, {
    type: "order",
    title: "Order placed",
    message: `Your order #${shortId} has been placed successfully.`,
    link: `/account/orders/${order._id}`,
  });
  notifyStaff("orders", {
    type: "new_order",
    title: owner.isGuest ? "New order (guest)" : "New order",
    message: `${owner.name} placed order #${shortId} (${formatMoney(order.totalPrice, order.currency)})`,
        link: "/admin/orders",
  });

  return order;
};

// @route POST /api/orders   (Private)
// body: { shippingAddress, deliveryMethod, paymentMethod, couponCode, paymentIntentId }
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, deliveryMethod = "standard", paymentMethod = "cod", couponCode, paymentIntentId } = req.body;

    const missing = missingAddressField(shippingAddress);
    if (missing) {
      return res.status(400).json({ message: `${missing} is required in shipping address` });
    }
    if (!["cod", "card"].includes(paymentMethod)) {
      return res.status(400).json({ message: "This payment method is not available yet" });
    }

    // Sab hisaab server par (browser ki bheji hui raqam par bharosa nahi)
    const totals = await computeOrderTotals({ userId: req.user._id, deliveryMethod, couponCode });
    if (totals.error) {
      return res.status(400).json({ message: totals.error });
    }

    let isPaid = false;
    let paidAt = null;

    if (paymentMethod === "card") {
      const check = await verifyCardPayment({
        paymentIntentId,
        totalPrice: totals.totalPrice,
        owner: { userId: req.user._id.toString() },
      });
      if (check.error) {
        return res.status(check.error.status).json({ message: check.error.message });
      }
      isPaid = true;
      paidAt = new Date();
    }

    const order = await finalizeOrder({
      owner: req.user,
      totals,
      shippingAddress,
      deliveryMethod,
      paymentMethod,
      paymentIntentId,
      isPaid,
      paidAt,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/guest-check   (Public) — body: { email }
// Step 1 par hi pata chal jaye ke is email se guest order ho sakta hai ya nahi
const checkGuest = async (req, res, next) => {
  try {
    const guest = await checkGuestEmail(req.body.email);
    if (guest.error) {
      return res.status(guest.error.status).json({ message: guest.error.message });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/guest-quote   (Public) — body: { items, deliveryMethod }
// Guest ke checkout par taaza (server wali) qeemat, shipping, tax aur total
const guestQuote = async (req, res, next) => {
  try {
    const { items, deliveryMethod = "standard" } = req.body;
    const totals = await computeOrderTotals({ items, deliveryMethod });
    if (totals.error) {
      return res.status(400).json({ message: totals.error });
    }
    res.json({
      itemsPrice: totals.itemsPrice,
      shippingPrice: totals.shippingPrice,
      taxPrice: totals.taxPrice,
      taxRate: totals.taxRate,
      taxLabel: totals.taxLabel,
      totalPrice: totals.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/guest   (Public)
// body: { email, shippingAddress, items, deliveryMethod, paymentMethod, paymentIntentId }
const createGuestOrder = async (req, res, next) => {
  try {
    const { shippingAddress, items, deliveryMethod = "standard", paymentMethod = "cod", paymentIntentId } = req.body;

    // Email ki jaanch payment se PEHLE
    const guest = await checkGuestEmail(req.body.email);
    if (guest.error) {
      return res.status(guest.error.status).json({ message: guest.error.message });
    }

    const missing = missingAddressField(shippingAddress);
    if (missing) {
      return res.status(400).json({ message: `${missing} is required in shipping address` });
    }
    if (!["cod", "card"].includes(paymentMethod)) {
      return res.status(400).json({ message: "This payment method is not available yet" });
    }

    const totals = await computeOrderTotals({ items, deliveryMethod });
    if (totals.error) {
      return res.status(400).json({ message: totals.error });
    }

    let isPaid = false;
    let paidAt = null;

    if (paymentMethod === "card") {
      const check = await verifyCardPayment({
        paymentIntentId,
        totalPrice: totals.totalPrice,
        owner: { guestEmail: guest.email },
      });
      if (check.error) {
        return res.status(check.error.status).json({ message: check.error.message });
      }
      isPaid = true;
      paidAt = new Date();
    }

    const owner = await getOrCreateGuest({
      email: guest.email,
      name: shippingAddress.fullName,
      phone: shippingAddress.phone,
    });

    // Bohat kam: isi lamhe kisi ne is email se asli account bana liya
    if (!owner.isGuest || owner.isBlocked) {
      if (isPaid) await refundPaymentIntent(paymentIntentId, "guest-conflict");
      return res.status(409).json({
        message: "An account now exists with this email. Please log in. Any card payment has been refunded.",
      });
    }

    const order = await finalizeOrder({
      owner,
      totals,
      shippingAddress,
      deliveryMethod,
      paymentMethod,
      paymentIntentId,
      isPaid,
      paidAt,
    });

    const result = order.toObject();
    delete result.paymentIntentId;
    delete result.user;
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/track   (Public) — body: { orderId, email }
// Order number + email se order ki halat. Sirf zaroori maloomat, poora address nahi.
const trackOrder = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const orderRef = String(req.body.orderId || "").trim().replace(/^#/, "");

    // Har tarah ki nakami par ek hi jawab (email ya order ka andaza na lagaya ja sake)
    const notFound = { message: "We couldn't find an order with these details" };

    if (!emailRegex.test(email) || !/^[0-9a-fA-F]{6,24}$/.test(orderRef)) {
      return res.status(404).json(notFound);
    }

    const user = await User.findOne({ email }).select("_id");
    if (!user) {
      return res.status(404).json(notFound);
    }

    const order = await Order.findOne({
      user: user._id,
      $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${orderRef}$`, options: "i" } },
    });
    if (!order) {
      return res.status(404).json(notFound);
    }

    res.json({
      _id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      isPaid: order.isPaid,
      isRefunded: order.isRefunded,
      trackingNumber: order.trackingNumber,
      cancelReason: order.cancelReason,
      itemsPrice: order.itemsPrice,
      discountAmount: order.discountAmount,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,
      taxRate: order.taxRate,
      taxLabel: order.taxLabel,
      totalPrice: order.totalPrice,
      city: order.shippingAddress?.city || "",
      items: order.items.map((i) => ({
        name: i.name,
        image: i.image,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/my   (Private)
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/:id   (Private — apna order, ya admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product", "slug status");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/shipping-rates   (Public) — checkout ke liye rates
const getShippingRates = async (req, res, next) => {
  try {
    res.json(await getShippingConfig());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  checkGuest,
  guestQuote,
  createGuestOrder,
  trackOrder,
  getMyOrders,
  getOrderById,
  getShippingRates,
};