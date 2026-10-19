const Order = require("../models/Order");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { changeStock } = require("../utils/stockLog");
const { notifyUser, notifyStaff } = require("../utils/notify");
const { refundOrderPayment } = require("../utils/refund");
const { sendTemplatedEmail } = require("../utils/emailTemplates");
const { formatMoney } = require("../utils/currency");

const RETURN_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const FLOW = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const shortId = (order) => order._id.toString().slice(-8).toUpperCase();
const isStripeError = (error) => typeof error?.type === "string" && error.type.startsWith("Stripe");

const emailHtml = (order, heading, message) => `
  <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
    <h2 style="color: #0F766E;">${heading}</h2>
    <p>${message}</p>
    <p><strong>Order ID:</strong> #${shortId(order)}</p>
        <p><strong>Total:</strong> ${formatMoney(order.totalPrice, order.currency)}</p>
    <p style="color: #52606D; font-size: 13px;">Thank you for shopping with ShopEase.</p>
  </div>
`;

const emailCustomer = async (order, subject, heading, message) => {
  const owner = await User.findById(order.user).select("email");
  if (owner?.email) {
    sendEmail({ to: owner.email, subject, html: emailHtml(order, heading, message) });
  }
};

// Order ke items ka stock wapas (history mein bhi darj hota hai)
const restockOrder = async (order, reason, userId) => {
  for (const item of order.items) {
    await changeStock(item.product, item.quantity, {
      reason,
      source: "order",
      user: userId,
      soldDelta: -item.quantity,
    });
  }
};

// Cancel ka asal kaam: pehle refund (fail ho to kuch nahi badalta), phir status, phir stock
const finishCancellation = async (order, reason, actorId) => {
  await refundOrderPayment(order);
  order.status = "cancelled";
  order.cancelReason = reason;
  await order.save();
  await restockOrder(order, `Order cancelled (#${shortId(order)})`, actorId);

  const refundNote = order.isRefunded ? " Your payment has been refunded." : "";
  notifyUser(order.user, {
    type: "order",
    title: "Order cancelled",
    message: `#${shortId(order)}: Your order has been cancelled.${refundNote}`,
    link: `/account/orders/${order._id}`,
  });
  emailCustomer(
    order,
    "Order cancelled - ShopEase",
    "Order Cancelled",
    `Your order has been cancelled. Reason: ${escapeHtml(reason)}.${refundNote}`
  );
};

// @route GET /api/orders/admin/all?status=&keyword=&page=&limit=   (Orders permission)
const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 1000);
    const { status, keyword } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (keyword && keyword.trim()) {
      const escaped = escapeRegex(keyword.trim());
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { "shippingAddress.fullName": regex },
        { "shippingAddress.phone": regex },
        // Order ID: poori ya aakhri ke kuch harf (jaise #2D76A9F3)
        { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: escaped, options: "i" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/admin/:id
const getOrderAdmin = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("+internalNotes")
      .populate("user", "name email phone");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/status   body: { status?, trackingNumber?, internalNotes? }
const updateStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, internalNotes } = req.body;

    const order = await Order.findById(req.params.id).select("+internalNotes");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status !== undefined) {
      if (["cancelled", "returned"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Use the Cancel Order or Process Refund button for this" });
      }
      const from = FLOW.indexOf(order.status);
      const to = FLOW.indexOf(status);
      if (to === -1) {
        return res.status(400).json({ message: "Invalid status" });
      }
      if (from === -1) {
        return res
          .status(400)
          .json({ message: `This order is ${order.status} and its status cannot be changed` });
      }
      if (to <= from) {
        return res
          .status(400)
          .json({ message: `Order is already ${order.status}. Status can only move forward` });
      }

      order.status = status;
      if (status === "delivered") {
        order.deliveredAt = new Date();
        if (order.paymentMethod === "cod") {
          order.isPaid = true;
          order.paidAt = new Date();
        }
      }
    }

    if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).trim();
    if (internalNotes !== undefined) order.internalNotes = String(internalNotes);

    await order.save();

    if (status) {
      const notificationText = {
        processing: "Your order is being processed.",
        shipped: order.trackingNumber
          ? `Your order has been shipped. Tracking number: ${order.trackingNumber}`
          : "Your order has been shipped.",
        out_for_delivery: "Your order is out for delivery today.",
        delivered: "Your order has been delivered.",
      };
      if (notificationText[status]) {
        notifyUser(order.user, {
          type: "order",
          title: `Order ${status.replace(/_/g, " ")}`,
          message: `#${shortId(order)}: ${notificationText[status]}`,
          link: `/account/orders/${order._id}`,
        });
      }

         if (["shipped", "out_for_delivery", "delivered"].includes(status)) {
        const owner = await User.findById(order.user).select("name email");
        if (owner) sendTemplatedEmail(status, order, owner);
      }
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/:id/admin-cancel   body: { reason }   (Orders permission)
const cancelOrderAdmin = async (req, res, next) => {
  try {
    const reason = req.body.reason?.trim();
    if (!reason) {
      return res.status(400).json({ message: "A cancellation reason is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({ message: "Only Pending or Processing orders can be cancelled" });
    }

    try {
      await finishCancellation(order, reason, req.user._id);
    } catch (error) {
      if (isStripeError(error)) {
        return res.status(400).json({ message: `Refund failed: ${error.message}` });
      }
      throw error;
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/cancel   body: { reason? }   (Customer, apna order)
const cancelOrderCustomer = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }
    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({ message: "This order can no longer be cancelled" });
    }

    const reason = req.body.reason?.trim() || "Cancelled by customer";

    try {
      await finishCancellation(order, reason, req.user._id);
    } catch (error) {
      if (isStripeError(error)) {
        return res
          .status(400)
          .json({ message: "We could not refund your payment right now. Please contact support." });
      }
      throw error;
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/:id/return   body: { reason }   (Customer, apna delivered order)
const requestReturn = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }
    if (order.returnRequest?.status && order.returnRequest.status !== "none") {
      return res.status(400).json({ message: "A return has already been requested for this order" });
    }

    const deliveredAt = order.deliveredAt || order.updatedAt;
    if (Date.now() - new Date(deliveredAt).getTime() > RETURN_WINDOW_DAYS * DAY_MS) {
      return res
        .status(400)
        .json({ message: `The ${RETURN_WINDOW_DAYS}-day return window for this order has passed` });
    }

    const reason = req.body.reason?.trim();
    if (!reason || reason.length < 5) {
      return res
        .status(400)
        .json({ message: "Please tell us why you want to return this order (at least 5 characters)" });
    }

    order.returnRequest = { status: "requested", reason, requestedAt: new Date() };
    await order.save();

    notifyStaff("orders", {
      type: "new_order",
      title: "Return requested",
      message: `${req.user.name} requested a return for order #${shortId(order)}`,
      link: `/admin/orders/${order._id}`,
    });
    notifyUser(req.user._id, {
      type: "order",
      title: "Return request received",
      message: `#${shortId(order)}: We have received your return request and will review it soon.`,
      link: `/account/orders/${order._id}`,
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/orders/:id/return/review   body: { decision: "approve"|"reject", note }
const reviewReturn = async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approve or reject" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.returnRequest?.status !== "requested") {
      return res.status(400).json({ message: "There is no pending return request on this order" });
    }
    if (decision === "reject" && !note?.trim()) {
      return res.status(400).json({ message: "Please give a reason for rejecting the return" });
    }

    order.returnRequest.status = decision === "approve" ? "approved" : "rejected";
    order.returnRequest.decidedAt = new Date();
    order.returnRequest.adminNote = note?.trim() || "";
    await order.save();

    const approved = decision === "approve";
    notifyUser(order.user, {
      type: "order",
      title: approved ? "Return approved" : "Return rejected",
      message: approved
        ? `#${shortId(order)}: Your return has been approved. Your refund will be processed shortly.`
        : `#${shortId(order)}: Your return request was not approved. ${order.returnRequest.adminNote}`,
      link: `/account/orders/${order._id}`,
    });
    emailCustomer(
      order,
      approved ? "Return approved - ShopEase" : "Return request update - ShopEase",
      approved ? "Return Approved" : "Return Request Not Approved",
      approved
        ? "Your return request has been approved. Your refund will be processed shortly."
        : `Unfortunately your return request was not approved. Reason: ${escapeHtml(order.returnRequest.adminNote)}`
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/:id/refund   (Orders permission) — approved return ka refund
const processRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.returnRequest?.status !== "approved" || order.status !== "delivered") {
      return res
        .status(400)
        .json({ message: "A refund can only be processed for an approved return on a delivered order" });
    }

    try {
      await refundOrderPayment(order);
    } catch (error) {
      if (isStripeError(error)) {
        return res.status(400).json({ message: `Refund failed: ${error.message}` });
      }
      throw error;
    }

    order.status = "returned";
    await order.save();
    await restockOrder(order, `Order returned and refunded (#${shortId(order)})`, req.user._id);

    notifyUser(order.user, {
      type: "order",
      title: "Refund processed",
      message: `#${shortId(order)}: Your return is complete and your refund has been processed.`,
      link: `/account/orders/${order._id}`,
    });
    emailCustomer(
      order,
      "Refund processed - ShopEase",
      "Refund Processed",
      "Your return is complete and your refund has been processed."
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrders,
  getOrderAdmin,
  updateStatus,
  cancelOrderAdmin,
  cancelOrderCustomer,
  requestReturn,
  reviewReturn,
  processRefund,
};