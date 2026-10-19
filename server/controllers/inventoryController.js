const Product = require("../models/Product");
const StockLog = require("../models/StockLog");
const SiteSettings = require("../models/SiteSettings");
const sendEmail = require("../utils/sendEmail");
const { logStockChange } = require("../utils/stockLog");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getThreshold = async () => {
  const settings = await SiteSettings.findOne();
  return settings?.inventory?.lowStockThreshold ?? 5;
};

// @route GET /api/inventory?keyword=&filter=all|low|out&page=&limit=
const getInventory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 100);
    const { keyword, filter } = req.query;
    const threshold = await getThreshold();

    const match = {};
    if (keyword && keyword.trim()) {
      const regex = new RegExp(escapeRegex(keyword.trim()), "i");
      match.$or = [{ name: regex }, { sku: regex }];
    }
    if (filter === "low") match.stock = { $gt: 0, $lte: threshold };
    if (filter === "out") match.stock = 0;

    const [products, total, lowCount, outCount] = await Promise.all([
      Product.find(match)
        .select("name sku stock status images")
        .sort({ stock: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(match),
      Product.countDocuments({ stock: { $gt: 0, $lte: threshold } }),
      Product.countDocuments({ stock: 0 }),
    ]);

    res.json({ products, page, pages: Math.ceil(total / limit), total, threshold, lowCount, outCount });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/inventory/threshold   body: { threshold }
const setThreshold = async (req, res, next) => {
  try {
    const value = Number(req.body.threshold);
    if (!Number.isInteger(value) || value < 0 || value > 10000) {
      return res.status(400).json({ message: "Threshold must be a whole number between 0 and 10000" });
    }

    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    settings.inventory = { lowStockThreshold: value };
    await settings.save();

    res.json({ threshold: value });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/inventory/:id/adjust   body: { change, reason }
// change: +10 (stock aaya) ya -3 (kam hua)
const adjustStock = async (req, res, next) => {
  try {
    const change = Number(req.body.change);
    const reason = req.body.reason?.trim();

    if (!Number.isInteger(change) || change === 0) {
      return res.status(400).json({ message: "Change must be a non-zero whole number" });
    }
    if (!reason) {
      return res.status(400).json({ message: "A reason is required for every stock change" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const previousStock = product.stock;
    const newStock = previousStock + change;
    if (newStock < 0) {
      return res.status(400).json({ message: `Cannot remove ${-change}. Only ${previousStock} in stock` });
    }

    const wasOutOfStock = previousStock === 0 || product.status === "out_of_stock";

    product.stock = newStock;
    if (wasOutOfStock && newStock > 0 && product.status === "out_of_stock") {
      product.status = "active";
    }
    await product.save();

    await logStockChange({
      product: product._id,
      previousStock,
      newStock,
      reason,
      source: "manual",
      user: req.user._id,
    });

    // Wapas stock mein aaya to "Notify Me" wale customers ko email
    if (wasOutOfStock && newStock > 0 && product.status === "active" && product.notifyList?.length > 0) {
      product.notifyList.forEach((email) => {
        sendEmail({
          to: email,
          subject: `Back in Stock: ${product.name} - ShopEase`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
              <h2 style="color: #0F766E;">Good news!</h2>
              <p><strong>${product.name}</strong> is back in stock.</p>
              <p>Grab it before it sells out again.</p>
            </div>
          `,
        });
      });
      product.notifyList = [];
      await product.save();
    }

    res.json({ _id: product._id, stock: product.stock, status: product.status });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/inventory/history?product=&page=&limit=
const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    const filter = {};
    if (req.query.product) filter.product = req.query.product;

    const [logs, total] = await Promise.all([
      StockLog.find(filter)
        .populate("product", "name sku")
        .populate("user", "name role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StockLog.countDocuments(filter),
    ]);

    res.json({ logs, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, setThreshold, adjustStock, getHistory };