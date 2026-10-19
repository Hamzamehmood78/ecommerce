const Product = require("../models/Product");
const StockLog = require("../models/StockLog");
const SiteSettings = require("../models/SiteSettings");
const { notifyStaff } = require("./notify");

// Stock threshold ke barabar/neeche pahunche ya bilkul khatam ho to staff ko alert
const checkLowStock = async (productId, previousStock, newStock) => {
  const settings = await SiteSettings.findOne();
  const threshold = settings?.inventory?.lowStockThreshold ?? 5;

  const crossedLow = previousStock > threshold && newStock <= threshold;
  const becameOut = previousStock > 0 && newStock === 0;
  if (!crossedLow && !becameOut) return;

  const product = await Product.findById(productId).select("name");
  const name = product?.name || "A product";

  notifyStaff("inventory", {
    type: "low_stock",
    title: newStock === 0 ? "Out of stock" : "Low stock",
    message: newStock === 0 ? `${name} is out of stock` : `${name} has only ${newStock} left`,
    link: "/admin/inventory",
  });
};

// Ek stock tabdeeli ka record likhta hai. Fail ho to bhi asal kaam nahi rukta.
const logStockChange = async ({ product, previousStock, newStock, reason, source, user = null }) => {
  try {
    if (previousStock === newStock) return;
    await StockLog.create({
      product,
      previousStock,
      newStock,
      change: newStock - previousStock,
      reason,
      source,
      user,
    });
    await checkLowStock(product, previousStock, newStock);
  } catch (error) {
    console.error("Stock log failed:", error.message);
  }
};

// Stock badalta bhi hai aur log bhi karta hai (orders ke liye)
const changeStock = async (productId, delta, { reason, source, user = null, soldDelta = 0 }) => {
  const updated = await Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: delta, soldCount: soldDelta } },
    { new: true }
  );
  if (updated) {
    await logStockChange({
      product: productId,
      previousStock: updated.stock - delta,
      newStock: updated.stock,
      reason,
      source,
      user,
    });
  }
  return updated;
};

module.exports = { logStockChange, changeStock };