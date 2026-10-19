const Order = require("../models/Order");
const { refundOrderPayment } = require("../utils/refund");

// @route GET /api/admin/payments/transactions   (Admin)
const getTransactions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status === "paid") filter.isPaid = true;
    if (status === "pending") filter.isPaid = false;
    if (status === "refunded") filter.isRefunded = true;

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/payments/:id/refund   (Admin)
// Card se paid order par Stripe se asli refund, COD par sirf "refunded" mark
const markRefunded = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!order.isPaid) {
      return res.status(400).json({ message: "This order has not been paid yet" });
    }
    if (order.isRefunded) {
      return res.status(400).json({ message: "This order has already been refunded" });
    }

    try {
      await refundOrderPayment(order);
    } catch (error) {
      if (typeof error?.type === "string" && error.type.startsWith("Stripe")) {
        return res.status(400).json({ message: `Refund failed: ${error.message}` });
      }
      throw error;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, markRefunded };