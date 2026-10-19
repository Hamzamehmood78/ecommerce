const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 731; // zyada se zyada 2 saal
const COUNTED = { $nin: ["cancelled", "returned"] }; // revenue mein yeh orders nahi ginte
const STATUSES = ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

const parseRange = (query) => {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getFullYear(), to.getMonth(), 1);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) return { error: "Invalid date range" };
  if (from > to) return { error: "Start date must be before the end date" };
  if (to - from > MAX_RANGE_DAYS * DAY_MS) return { error: "Date range is too large (maximum 2 years)" };
  return { from, to };
};

// Galat ya khali timezone aaye to UTC par chale, crash nahi
const safeTimeZone = (tz) => {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
};

// "2026-10-12" jaisi tareekh, diye gaye timezone ke hisaab se
const dayLabel = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

// @route GET /api/admin/stats?from=&to=&timezone=   (Reports permission)
const getDashboardStats = async (req, res, next) => {
  try {
    const range = parseRange(req.query);
    if (range.error) {
      return res.status(400).json({ message: range.error });
    }
    const { from, to } = range;
    const timeZone = safeTimeZone(req.query.timezone);

    const inRange = { createdAt: { $gte: from, $lte: to } };
    const groupByMonth = to - from > 92 * DAY_MS;
    const format = groupByMonth ? "%Y-%m" : "%Y-%m-%d";

    const settings = await SiteSettings.findOne();
    const lowStockThreshold = settings?.inventory?.lowStockThreshold ?? 5;

    const [statusCounts, revenueByPeriod, topProducts, totalCustomers, newCustomers, lowStockProducts, recentOrders] =
      await Promise.all([
        Order.aggregate([{ $match: inRange }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { ...inRange, status: COUNTED } },
          {
            $group: {
              _id: { $dateToString: { format, date: "$createdAt", timezone: timeZone } },
              revenue: { $sum: "$totalPrice" },
              orders: { $sum: 1 },
            },
          },
        ]),
        Order.aggregate([
          { $match: { ...inRange, status: COUNTED } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.product",
              name: { $first: "$items.name" },
              image: { $first: "$items.image" },
              unitsSold: { $sum: "$items.quantity" },
              revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ]),
        User.countDocuments({ role: "customer" }),
        User.countDocuments({ role: "customer", createdAt: { $gte: from, $lte: to } }),
        Product.find({ stock: { $lte: lowStockThreshold }, status: { $ne: "draft" } })
          .select("name stock images")
          .sort({ stock: 1 })
          .limit(6),
        Order.find(inRange).populate("user", "name").sort({ createdAt: -1 }).limit(8),
      ]);

    const counts = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    const get = (status) => counts[status] || 0;

    // Chart ke liye khali din/mahine bhi (revenue 0) bhar dete hain, taake time ka silsila poora ho
    const labels = new Set();
    for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
      const label = dayLabel(new Date(t), timeZone);
      labels.add(groupByMonth ? label.slice(0, 7) : label);
    }
    const lastLabel = dayLabel(to, timeZone);
    labels.add(groupByMonth ? lastLabel.slice(0, 7) : lastLabel);

    const byLabel = Object.fromEntries(revenueByPeriod.map((r) => [r._id, r]));
    const salesSeries = [...labels].map((label) => ({
      label,
      revenue: byLabel[label]?.revenue || 0,
      orders: byLabel[label]?.orders || 0,
    }));

    res.json({
      range: { from, to, groupBy: groupByMonth ? "month" : "day", timeZone },
      totalRevenue: revenueByPeriod.reduce((sum, r) => sum + r.revenue, 0),
      totalOrders: statusCounts.reduce((sum, s) => sum + s.count, 0),
      pendingOrders: get("pending"),
      processingOrders: get("processing") + get("shipped") + get("out_for_delivery"),
      deliveredOrders: get("delivered"),
      returnedOrders: get("returned"),
      cancelledOrders: get("cancelled"),
      totalCustomers,
      newCustomers,
      statusBreakdown: STATUSES.map((status) => ({ status, count: get(status) })),
      salesSeries,
      topProducts,
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };