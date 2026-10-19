const express = require("express");
const {
  createOrder,
  checkGuest,
  guestQuote,
  createGuestOrder,
  trackOrder,
  getMyOrders,
  getOrderById,
  getShippingRates,
} = require("../controllers/orderController");
const {
  listOrders,
  getOrderAdmin,
  updateStatus,
  cancelOrderAdmin,
  cancelOrderCustomer,
  requestReturn,
  reviewReturn,
  processRefund,
} = require("../controllers/orderManagementController");
const { protect, canManageOrders } = require("../middleware/authMiddleware");
const { guestCheckoutLimiter, trackOrderLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// Public (login ke baghair)
router.get("/shipping-rates", getShippingRates);
router.post("/guest-check", guestCheckoutLimiter, checkGuest);
router.post("/guest-quote", guestCheckoutLimiter, guestQuote);
router.post("/guest", guestCheckoutLimiter, createGuestOrder);
router.post("/track", trackOrderLimiter, trackOrder);

router.use(protect);

// Admin / Staff (Orders permission)
router.get("/admin/all", canManageOrders, listOrders);
router.get("/admin/:id", canManageOrders, getOrderAdmin);
router.put("/:id/status", canManageOrders, updateStatus);
router.post("/:id/admin-cancel", canManageOrders, cancelOrderAdmin);
router.put("/:id/return/review", canManageOrders, reviewReturn);
router.post("/:id/refund", canManageOrders, processRefund);

// Customer
router.post("/", createOrder);
router.get("/my", getMyOrders);
router.post("/:id/return", requestReturn);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrderCustomer);

module.exports = router;