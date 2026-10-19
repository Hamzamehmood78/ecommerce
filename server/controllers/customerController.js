const User = require("../models/User");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @route GET /api/customers?keyword=&page=&limit=
const getCustomers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 1000);
    const { keyword } = req.query;

    const match = { role: "customer" };
    if (keyword && keyword.trim()) {
      const regex = new RegExp(escapeRegex(keyword.trim()), "i");
      match.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [result] = await User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $lookup: { from: "orders", localField: "_id", foreignField: "user", as: "orders" } },
            {
              // Sirf zaroori fields (password yahan se bahar hi rehta hai)
              $project: {
                name: 1,
                email: 1,
                phone: 1,
                isBlocked: 1,
                isGuest: 1,
                createdAt: 1,
                orderCount: { $size: "$orders" },
                totalSpent: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: { input: "$orders", as: "o", cond: { $not: [{ $in: ["$$o.status", ["cancelled", "returned"]] }] } },
                      },
                      as: "o",
                      in: "$$o.totalPrice",
                    },
                  },
                },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const total = result.total[0]?.count || 0;
    res.json({ customers: result.data, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "customer" }).select("-password");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const [orders, wishlist] = await Promise.all([
      Order.find({ user: customer._id })
        .sort({ createdAt: -1 })
        .select("items.name items.quantity totalPrice status createdAt shippingAddress"),
      Wishlist.findOne({ user: customer._id }).populate("products", "name slug price discountPrice images"),
    ]);

    // Orders mein use hue addresses (duplicate hata kar)
    const seen = new Set();
    const addresses = [];
    orders.forEach((order) => {
      const a = order.shippingAddress;
      if (!a) return;
      const key = [a.addressLine1, a.city, a.zip].join("|").toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        addresses.push(a);
      }
    });

    const totalSpent = orders
      .filter((o) => !["cancelled", "returned"].includes(o.status))
      .reduce((sum, o) => sum + o.totalPrice, 0);

    res.json({
      customer,
      stats: { orderCount: orders.length, totalSpent },
      orders,
      addresses,
      wishlist: wishlist?.products || [],
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/customers/:id/block   body: { isBlocked: true/false }
const setBlocked = async (req, res, next) => {
  try {
    const { isBlocked } = req.body;
    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ message: "isBlocked must be true or false" });
    }

    const customer = await User.findOne({ _id: req.params.id, role: "customer" });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.isBlocked = isBlocked;
    await customer.save();
    res.json({ _id: customer._id, isBlocked: customer.isBlocked });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, getCustomerById, setBlocked };