const express = require("express");
const { getMyNotifications, markAllRead, markRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getMyNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markRead);

module.exports = router;