const express = require("express");
const { getCustomers, getCustomerById, setBlocked } = require("../controllers/customerController");
const { protect, canManageCustomers } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, canManageCustomers);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.put("/:id/block", setBlocked);

module.exports = router;