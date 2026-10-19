const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Sirf logged-in users ke liye
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Sirf Super Admin (jaise Staff management ke liye)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

// Super Admin hamesha andar; Staff tab jab diye gaye naamon mein se
// koi ek permission uske paas ho
const requirePermission = (...permissions) => (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (user.role === "admin") {
    return next();
  }
  if (user.role === "staff" && permissions.some((p) => (user.permissions || []).includes(p))) {
    return next();
  }
  return res.status(403).json({ message: "You do not have permission to do this" });
};

// Tayyar shuda naam, taake routes mein padhna aasan ho
const canManageProducts = requirePermission("products");
const canManageCategories = requirePermission("categories");
const canReadCategories = requirePermission("categories", "products", "coupons");
const canManageOrders = requirePermission("orders");
const canManageReviews = requirePermission("reviews");
const canManageCoupons = requirePermission("coupons");
const canManageBanners = requirePermission("banners");
const canViewReports = requirePermission("reports");
const canManageMessages = requirePermission("messages");
const canManagePayments = requirePermission("payments");
const canUploadImages = requirePermission("products", "categories", "banners");
const canManageSettings = requirePermission("homepage", "settings", "shipping", "payments");
const canManageCustomers = requirePermission("customers");
const canManageInventory = requirePermission("inventory");

module.exports = {
  protect,
  adminOnly,
  requirePermission,
  canManageProducts,
  canManageCategories,
  canReadCategories,
  canManageOrders,
  canManageReviews,
  canManageCoupons,
  canManageBanners,
  canViewReports,
  canManageMessages,
  canManagePayments,
  canUploadImages,
  canManageSettings,
  canManageCustomers,
    canManageInventory,
};