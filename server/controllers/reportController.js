const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");

const getDateRange = (req) => {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000); // default: last 30 days
  from.setHours(0, 0, 0, 0);
  return { from, to };
};

// @route GET /api/admin/reports/sales?from=&to=   (Admin)
const getSalesReport = async (req, res, next) => {
  try {
    const { from, to } = getDateRange(req);

    const daily = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: { $nin: ["cancelled", "returned"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = daily.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = daily.reduce((sum, d) => sum + d.orders, 0);

    res.json({
      from, to, totalRevenue, totalOrders,
      daily: daily.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/reports/products?from=&to=   (Admin)
const getProductPerformanceReport = async (req, res, next) => {
  try {
    const { from, to } = getDateRange(req);

    const performance = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: { $nin: ["cancelled", "returned"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      from, to,
      topSelling: performance.slice(0, 10),
      worstSelling: [...performance].sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/reports/customers?from=&to=   (Admin)
const getCustomerReport = async (req, res, next) => {
  try {
    const { from, to } = getDateRange(req);

    const [newCustomers, spenders] = await Promise.all([
      User.countDocuments({ role: "customer", createdAt: { $gte: from, $lte: to } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to }, status: { $nin: ["cancelled", "returned"] } } },
        { $group: { _id: "$user", totalSpent: { $sum: "$totalPrice" }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" },
        },
        { $unwind: "$user" },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            totalSpent: 1,
            orderCount: 1,
            isNewCustomer: { $gte: ["$user.createdAt", from] },
          },
        },
      ]),
    ]);

    const distinctBuyerIds = await Order.distinct("user", { createdAt: { $gte: from, $lte: to }, status: { $nin: ["cancelled", "returned"] } });
    const returningCustomers = Math.max(distinctBuyerIds.length - newCustomers, 0);

    res.json({ from, to, newCustomers, returningCustomers, topSpenders: spenders });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/reports/order-status?from=&to=   (Admin)
const getOrderStatusReport = async (req, res, next) => {
  try {
    const { from, to } = getDateRange(req);

    const breakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const allStatuses = ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
    const result = allStatuses.map((status) => ({
      status,
      count: breakdown.find((b) => b._id === status)?.count || 0,
    }));

    res.json({ from, to, breakdown: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, getProductPerformanceReport, getCustomerReport, getOrderStatusReport };