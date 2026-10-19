const rateLimit = require("express-rate-limit");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ message }),
  });

// Ek device (IP) se login ki had
const loginLimiter = createLimiter(
  15 * MINUTE,
  20,
  "Too many login attempts from this device. Please try again in 15 minutes."
);

const registerLimiter = createLimiter(
  HOUR,
  10,
  "Too many accounts created from this device. Please try again later."
);

const passwordResetLimiter = createLimiter(
  HOUR,
  10,
  "Too many password reset requests. Please try again later."
);

// Login ke baad "current password" daal kar guess karne se rokne ke liye
const passwordChangeLimiter = createLimiter(
  HOUR,
  10,
  "Too many password change attempts. Please try again later."
);

// Review ki photos ki upload
const reviewUploadLimiter = createLimiter(
  HOUR,
  20,
  "Too many photo uploads. Please try again later."
);

// Guest checkout ke endpoints (login ke baghair khule hain)
const guestCheckoutLimiter = createLimiter(
  HOUR,
  60,
  "Too many checkout attempts from this device. Please try again later."
);

// Order track karne ki koshishen (order number guess karne se rokne ke liye)
const trackOrderLimiter = createLimiter(
  HOUR,
  20,
  "Too many tracking attempts. Please try again later."
);

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  passwordChangeLimiter,
  reviewUploadLimiter,
  guestCheckoutLimiter,
  trackOrderLimiter,
};