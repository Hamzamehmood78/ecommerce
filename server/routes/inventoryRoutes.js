const express = require("express");
const { getInventory, setThreshold, adjustStock, getHistory } = require("../controllers/inventoryController");
const { protect, canManageInventory } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, canManageInventory);
router.get("/", getInventory);
router.get("/history", getHistory);
router.put("/threshold", setThreshold);
router.post("/:id/adjust", adjustStock);

module.exports = router;