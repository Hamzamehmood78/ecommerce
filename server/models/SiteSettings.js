const mongoose = require("mongoose");

// Khali ("") ka matlab: default alfaaz istemal karo
const templateFields = {
  subject: { type: String, default: "" },
  heading: { type: String, default: "" },
  message: { type: String, default: "" },
};

const siteSettingsSchema = new mongoose.Schema({
  featuredProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  dealProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  sections: {
    categoryGrid: { type: Boolean, default: true },
    dealOfDay: { type: Boolean, default: true },
    newArrivals: { type: Boolean, default: true },
    testimonials: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    trustStrip: { type: Boolean, default: true },
  },
  store: {
    name: { type: String, default: "ShopEase" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  policies: {
    shipping: { type: String, default: "" },
    returns: { type: String, default: "" },
    privacy: { type: String, default: "" },
    terms: { type: String, default: "" },
  },
  shippingRates: {
    standard: { type: Number, default: 200 },
    express: { type: Number, default: 450 },
    freeShippingThreshold: { type: Number, default: 3000 },
  },
  paymentGateways: {
    stripeKey: { type: String, default: "" },
    paypalClientId: { type: String, default: "" },
    razorpayKeyId: { type: String, default: "" },
  },
  inventory: {
    lowStockThreshold: { type: Number, default: 5 },
  },
  tax: {
    enabled: { type: Boolean, default: false },
    rate: { type: Number, default: 0 },
    label: { type: String, default: "Tax" },
  },
  emailTemplates: {
    order_placed: { ...templateFields },
    shipped: { ...templateFields },
    out_for_delivery: { ...templateFields },
    delivered: { ...templateFields },
  },
});


module.exports =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", siteSettingsSchema);
