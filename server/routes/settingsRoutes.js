const express = require("express");
const {
  getSettings,
  getSettingsAdmin,
  getEmailTemplates,
  updateSettings,
} = require("../controllers/settingsController");
const {
  protect,
  requirePermission,
  canManageSettings,
  canManagePayments,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getSettings);
router.get("/admin", protect, canManagePayments, getSettingsAdmin);
router.get("/email-templates", protect, requirePermission("settings"), getEmailTemplates);
router.put("/", protect, canManageSettings, updateSettings);

module.exports = router;