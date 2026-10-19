const express = require("express");
const { getTransactions, markRefunded } = require("../controllers/paymentController");
const { protect, canManagePayments } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, canManagePayments);
router.get("/transactions", getTransactions);
router.put("/:id/refund", markRefunded);

module.exports = router;