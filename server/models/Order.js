const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    zip: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, "Order must have at least one item"],
    },
    shippingAddress: { type: addressSchema, required: true },
    deliveryMethod: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "paypal"],
      default: "cod",
    },
        paymentIntentId: { type: String, default: "" },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
    itemsPrice: { type: Number, required: true },
        couponCode: { type: String, default: "" },
            taxPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxLabel: { type: String, default: "Tax" },
    discountAmount: { type: Number, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
      default: "pending",
    },
    trackingNumber: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
       internalNotes: { type: String, default: "", select: false }, // sirf admin ko dikhte hain
    deliveredAt: { type: Date },
    returnRequest: {
      status: {
        type: String,
        enum: ["none", "requested", "approved", "rejected"],
        default: "none",
      },
      reason: { type: String, default: "" },
      requestedAt: { type: Date },
      decidedAt: { type: Date },
      adminNote: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);