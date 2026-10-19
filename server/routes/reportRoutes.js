const express = require("express");
const {
  getSalesReport,
  getProductPerformanceReport,
  getCustomerReport,
  getOrderStatusReport,
} = require("../controllers/reportController");
const { protect, canViewReports } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, canViewReports);
router.get("/sales", getSalesReport);
router.get("/products", getProductPerformanceReport);
router.get("/customers", getCustomerReport);
router.get("/order-status", getOrderStatusReport);

module.exports = router;