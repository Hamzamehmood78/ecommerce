const express = require("express");
const { createPaymentIntent, createGuestPaymentIntent } = require("../controllers/stripeController");
const { protect } = require("../middleware/authMiddleware");
const { guestCheckoutLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/create-intent", protect, createPaymentIntent);
router.post("/create-guest-intent", guestCheckoutLimiter, createGuestPaymentIntent);

module.exports = router;