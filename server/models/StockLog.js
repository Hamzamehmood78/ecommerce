const mongoose = require("mongoose");

const stockLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    change: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["manual", "order", "product_edit", "initial"],
      default: "manual",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

stockLogSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("StockLog", stockLogSchema);