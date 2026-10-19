const express = require("express");
const { sendMessage, getMessages, markRead, deleteMessage } = require("../controllers/contactController");
const { protect, canManageMessages } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", sendMessage);

router.use(protect, canManageMessages);
router.get("/admin/all", getMessages);
router.put("/:id/read", markRead);
router.delete("/:id", deleteMessage);

module.exports = router;