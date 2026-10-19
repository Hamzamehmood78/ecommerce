const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const SiteSettings = require("../models/SiteSettings");
const { formatMoney, roundMoney } = require("../utils/currency");

// Shared logic: coupon ko user ke current cart ke khilaf validate karke discount nikalta hai
const evaluateCoupon = async (code, userId) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) return { error: "Invalid coupon code" };
  if (!coupon.isActive) return { error: "This coupon is no longer active" };

  const now = new Date();
  if (now < coupon.startDate) return { error: "This coupon is not active yet" };
  if (now > coupon.expiryDate) return { error: "This coupon has expired" };

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { error: "This coupon has reached its usage limit" };
  }

  const userUsage = coupon.usedBy.find((u) => u.user.toString() === userId.toString());
  if (userUsage && userUsage.count >= coupon.usageLimitPerUser) {
    return { error: "You have already used this coupon the maximum number of times" };
  }

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty" };
  }

  if (coupon.applicableCategories.length > 0) {
    const cartCategoryIds = cart.items
      .filter((i) => i.product)
      .map((i) => i.product.category.toString());
    const hasEligibleItem = coupon.applicableCategories.some((catId) =>
      cartCategoryIds.includes(catId.toString())
    );
    if (!hasEligibleItem) {
      return { error: "This coupon does not apply to items in your cart" };
    }
  }

  const subtotal = cart.items.reduce((sum, item) => {
    if (!item.product) return sum;
    const price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  if (subtotal < coupon.minOrderValue) {
        const settings = await SiteSettings.findOne();
    return { error: `Minimum order value of ${formatMoney(coupon.minOrderValue, settings?.currency?.code)} required` };
  }

  let discountAmount =
    coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  discountAmount = Math.min(discountAmount, subtotal);

    const roundingSettings = await SiteSettings.findOne();
  return {
    coupon,
    discountAmount: roundMoney(discountAmount, roundingSettings?.currency?.code),
    subtotal,
  };
};

// @route POST /api/coupons/validate   (Private)   body: { code }
const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const result = await evaluateCoupon(code, req.user._id);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      code: result.coupon.code,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/coupons/admin/all   (Admin)
const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().populate("applicableCategories", "name").sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/coupons   (Admin)
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, usageLimit, usageLimitPerUser, expiryDate, applicableCategories } = req.body;

    if (!code?.trim() || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ message: "Code, discount type, value and expiry date are required" });
    }
    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({ message: "Percentage discount cannot exceed 100" });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "A coupon with this code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      usageLimit: usageLimit || null,
      usageLimitPerUser: usageLimitPerUser || 1,
      expiryDate,
      applicableCategories: applicableCategories || [],
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/coupons/:id   (Admin)
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const fields = ["discountType", "discountValue", "minOrderValue", "usageLimit", "usageLimitPerUser", "expiryDate", "applicableCategories", "isActive"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) coupon[field] = req.body[field];
    });

    if (req.body.code && req.body.code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({ code: req.body.code.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({ message: "A coupon with this code already exists" });
      }
      coupon.code = req.body.code.toUpperCase().trim();
    }

    const updated = await coupon.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/coupons/:id   (Admin)
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    await coupon.deleteOne();
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon, evaluateCoupon };