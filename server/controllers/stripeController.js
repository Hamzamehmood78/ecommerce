const stripe = require("../config/stripe");
const { computeOrderTotals } = require("../utils/pricing");
const { checkGuestEmail } = require("../utils/guest");
const { toMinorUnits } = require("../utils/currency");

// Payment hamesha STORE ki currency mein hoti hai (Admin → Store Settings),
// aur raqam server khud nikalta hai. Browser se raqam nahi li jati.

// @route POST /api/payments/create-intent   (Private)   body: { deliveryMethod, couponCode }
const createPaymentIntent = async (req, res, next) => {
  try {
    const { deliveryMethod = "standard", couponCode } = req.body;

    const totals = await computeOrderTotals({ userId: req.user._id, deliveryMethod, couponCode });
    if (totals.error) {
      return res.status(400).json({ message: totals.error });
    }
    if (totals.totalPrice <= 0) {
      return res.status(400).json({ message: "Nothing to pay" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toMinorUnits(totals.totalPrice),
      currency: totals.currency.toLowerCase(),
      metadata: { userId: req.user._id.toString() },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totals.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payments/create-guest-intent   (Public)   body: { items, email, deliveryMethod }
// Guest ke liye. Payment guest ki email ke saath bandh hoti hai.
const createGuestPaymentIntent = async (req, res, next) => {
  try {
    const { items, deliveryMethod = "standard" } = req.body;

    const guest = await checkGuestEmail(req.body.email);
    if (guest.error) {
      return res.status(guest.error.status).json({ message: guest.error.message });
    }

    const totals = await computeOrderTotals({ items, deliveryMethod });
    if (totals.error) {
      return res.status(400).json({ message: totals.error });
    }
    if (totals.totalPrice <= 0) {
      return res.status(400).json({ message: "Nothing to pay" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toMinorUnits(totals.totalPrice),
      currency: totals.currency.toLowerCase(),
      metadata: { guestEmail: guest.email },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totals.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentIntent, createGuestPaymentIntent };