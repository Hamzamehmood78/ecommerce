const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    heading: { type: String, required: true, trim: true },
    subtext: { type: String, default: "", trim: true },
    buttonText: { type: String, default: "Shop Now", trim: true },
    link: { type: String, default: "/shop", trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);