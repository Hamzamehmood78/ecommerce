const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const SiteSettings = require("../models/SiteSettings");
const { evaluateCoupon } = require("../controllers/couponController");
const { roundMoney } = require("./currency");

const getSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  return settings;
};

const shippingConfigFrom = (settings) => ({
  rates: {
    standard: { price: settings.shippingRates.standard, label: "Standard (3-5 days)" },
    express: { price: settings.shippingRates.express, label: "Express (1-2 days)" },
  },
  freeShippingThreshold: settings.shippingRates.freeShippingThreshold,
});

// Shipping ki qeemat aur free-shipping ki had (admin ki settings se)
const getShippingConfig = async () => shippingConfigFrom(await getSettings());

const calculateTax = (taxableAmount, tax, currency) =>
  tax?.enabled && tax.rate > 0 ? roundMoney((taxableAmount * tax.rate) / 100, currency) : 0;

// Guest ke bheje hue items [{ productId, quantity, size, color }] ko jaanch kar asal products se jorta hai.
// Browser ki bheji hui qeemat ya naam par bharosa nahi, sirf productId, quantity, size, color liye jate hain.
const buildGuestItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return { error: "Your cart is empty" };
  if (items.length > 50) return { error: "Too many items in the cart" };

  const merged = new Map();
  for (const raw of items) {
    if (!raw || !mongoose.isValidObjectId(raw.productId)) return { error: "Invalid item in the cart" };

    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { error: "Invalid item quantity" };

    const size = String(raw.size ?? "").slice(0, 50);
    const color = String(raw.color ?? "").slice(0, 50);
    const key = `${raw.productId}|${size}|${color}`;

    const existing = merged.get(key);
    if (existing) existing.quantity += quantity;
    else merged.set(key, { productId: String(raw.productId), quantity, size, color });
  }

  const lines = [...merged.values()];
  const products = await Product.find({ _id: { $in: lines.map((l) => l.productId) } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const cartItems = [];
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || product.status === "draft") {
      return { error: "An item in your cart is no longer available" };
    }
    if (line.size && product.sizes?.length && !product.sizes.includes(line.size)) {
      return { error: `Invalid size selected for ${product.name}` };
    }
    if (line.color && product.colors?.length && !product.colors.includes(line.color)) {
      return { error: `Invalid color selected for ${product.name}` };
    }
    cartItems.push({ product, quantity: line.quantity, size: line.size, color: line.color });
  }

  return { cartItems };
};

// Poora hisaab SERVER par: items, discount, shipping, tax, total.
// Logged-in customer: { userId } (database ka cart). Guest: { items } (browser ke bheje items).
// Order banane aur card ki raqam tay karne, dono jagah yehi ek function chalta hai.
const computeOrderTotals = async ({ userId, items, deliveryMethod, couponCode }) => {
  let cart = null;
  let sourceItems;

  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) return { error: "Your cart is empty" };
    sourceItems = cart.items;
  } else {
    const built = await buildGuestItems(items);
    if (built.error) return { error: built.error };
    sourceItems = built.cartItems;
  }

  const settings = await getSettings();
  const currency = settings.currency?.code || "PKR";

  const orderItems = [];
  let rawItemsPrice = 0;

  for (const cartItem of sourceItems) {
    const product = cartItem.product;
    if (!product) continue;

    if (product.stock < cartItem.quantity) {
      return { error: `${product.name} only has ${product.stock} item(s) in stock` };
    }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    rawItemsPrice += price * cartItem.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || "",
      price,
      quantity: cartItem.quantity,
      size: cartItem.size,
      color: cartItem.color,
    });
  }

  if (orderItems.length === 0) return { error: "No valid items to order" };

  const itemsPrice = roundMoney(rawItemsPrice, currency);

  const { rates, freeShippingThreshold } = shippingConfigFrom(settings);
  if (!rates[deliveryMethod]) return { error: "Invalid delivery method" };

  // Coupon sirf account wale customer ke liye
  let discountAmount = 0;
  let coupon = null;
  if (userId && couponCode) {
    const result = await evaluateCoupon(couponCode, userId);
    if (result.error) return { error: result.error };
    discountAmount = result.discountAmount;
    coupon = result.coupon;
  }

  // Free shipping aur tax dono discount ke BAAD ki raqam par
  const taxableAmount = roundMoney(Math.max(itemsPrice - discountAmount, 0), currency);
  const shippingPrice = taxableAmount > freeShippingThreshold ? 0 : rates[deliveryMethod].price;
  const taxPrice = calculateTax(taxableAmount, settings.tax, currency);

  return {
    cart,
    orderItems,
    itemsPrice,
    discountAmount,
    coupon,
    shippingPrice,
    taxPrice,
    taxRate: settings.tax?.enabled ? settings.tax.rate : 0,
    taxLabel: settings.tax?.label || "Tax",
    currency,
    totalPrice: roundMoney(taxableAmount + shippingPrice + taxPrice, currency),
  };
};

module.exports = { computeOrderTotals, getShippingConfig, calculateTax };