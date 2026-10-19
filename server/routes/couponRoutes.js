const express = require("express");
const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect, canManageCoupons } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/validate", validateCoupon);

router.get("/admin/all", canManageCoupons, getAllCoupons);
router.post("/", canManageCoupons, createCoupon);
router.put("/:id", canManageCoupons, updateCoupon);
router.delete("/:id", canManageCoupons, deleteCoupon);

module.exports = router;