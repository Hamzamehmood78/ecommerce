const express = require("express");
const {
  getBanners, getAllBannersAdmin, createBanner, updateBanner, deleteBanner, reorderBanners,
} = require("../controllers/bannerController");
const { protect, canManageBanners } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getBanners);
router.get("/admin/all", protect, canManageBanners, getAllBannersAdmin);
router.post("/", protect, canManageBanners, createBanner);
router.put("/reorder", protect, canManageBanners, reorderBanners);
router.put("/:id", protect, canManageBanners, updateBanner);
router.delete("/:id", protect, canManageBanners, deleteBanner);

module.exports = router;