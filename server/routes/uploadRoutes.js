const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { uploadImages, uploadAvatar, uploadReviewImages } = require("../controllers/uploadController");
const { protect, canUploadImages } = require("../middleware/authMiddleware");
const { reviewUploadLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/", protect, canUploadImages, upload.array("images", 6), uploadImages);
router.post("/avatar", protect, upload.single("image"), uploadAvatar);
router.post("/review", protect, reviewUploadLimiter, upload.array("images", 3), uploadReviewImages);

module.exports = router;