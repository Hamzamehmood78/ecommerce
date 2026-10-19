const express = require("express");
const {
  getProductReviews,
  getFeaturedReviews,
  canReview,
  createReview,
  toggleHelpful,
  getAllReviewsAdmin,
  moderateReview,
  replyToReview,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, canManageReviews } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/featured", getFeaturedReviews);
router.get("/product/:productId", getProductReviews);

router.use(protect);
router.get("/can-review/:productId", canReview);
router.post("/", createReview);
router.put("/:id/helpful", toggleHelpful);

router.get("/admin/all", canManageReviews, getAllReviewsAdmin);
router.put("/:id/moderate", canManageReviews, moderateReview);
router.post("/:id/reply", canManageReviews, replyToReview);
router.delete("/:id", canManageReviews, deleteReview);

module.exports = router;