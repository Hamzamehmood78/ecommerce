const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const PRODUCT_FIELDS = "name slug price discountPrice images stock status";
const MAX_SAVED_ITEMS = 50;
const MAX_QTY = 99;

// Ek product/size/color combination ek hi line item hoti hai
const sameVariant = (item, productId, size, color) =>
  item.product.toString() === productId.toString() &&
  (item.size || "") === (size || "") &&
  (item.color || "") === (color || "");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [], savedItems: [] });
  return cart;
};

const populateCart = (cart) =>
  cart.populate([
    { path: "items.product", select: PRODUCT_FIELDS },
    { path: "savedItems.product", select: PRODUCT_FIELDS },
  ]);

const clampQty = (value) => Math.min(Math.max(parseInt(value, 10) || 1, 1), MAX_QTY);

// @route GET /api/cart   (Private)
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

// @route POST /api/cart   (Private)  { productId, quantity, size, color }
const addToCart = async (req, res, next) => {
  try {
    const { productId, size = "", color = "" } = req.body;
    const quantity = Number(req.body.quantity ?? 1);

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Product is required" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be a whole number, at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.status === "out_of_stock" || product.stock === 0) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find((item) => sameVariant(item, productId, size, color));

    const newQuantity = existing ? existing.quantity + quantity : quantity;
    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    if (existing) {
      existing.quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity, size, color });
    }

    await cart.save();
    res.status(201).json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/cart/:itemId   (Private)  { quantity }
const updateCartItem = async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be a whole number, at least 1" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      item.deleteOne();
      await cart.save();
      return res.status(404).json({ message: "Product no longer exists, removed from cart" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    item.quantity = quantity;
    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/cart/:itemId   (Private)
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    item.deleteOne();
    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/cart   (Private) — poora cart khali (shelf nahi chhedta)
const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/cart/merge   (Private) — guest ka cart aur shelf login par jorna
// body: { items: [{ productId, quantity, size, color }], savedItems: [...] }
const mergeCart = async (req, res, next) => {
  try {
    const guestItems = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
    const guestSaved = Array.isArray(req.body.savedItems) ? req.body.savedItems.slice(0, 100) : [];
    const cart = await getOrCreateCart(req.user._id);

    // Galat ya khali productId chupke se chhor dete hain
    const loadProduct = async (productId) =>
      mongoose.isValidObjectId(productId) ? Product.findById(productId) : null;

    for (const guestItem of guestItems) {
      const product = await loadProduct(guestItem?.productId);
      if (!product || product.status === "draft" || product.status === "out_of_stock") continue;

      const size = String(guestItem.size ?? "");
      const color = String(guestItem.color ?? "");
      const existing = cart.items.find((item) => sameVariant(item, product._id, size, color));
      const quantity = Math.min((existing ? existing.quantity : 0) + clampQty(guestItem.quantity), product.stock);

      if (existing) {
        existing.quantity = quantity;
      } else if (quantity > 0) {
        cart.items.push({ product: product._id, quantity, size, color });
      }
    }

    for (const guestItem of guestSaved) {
      const product = await loadProduct(guestItem?.productId);
      if (!product || product.status === "draft") continue;

      const size = String(guestItem.size ?? "");
      const color = String(guestItem.color ?? "");
      const existing = cart.savedItems.find((item) => sameVariant(item, product._id, size, color));

      if (existing) {
        existing.quantity = Math.min(existing.quantity + clampQty(guestItem.quantity), MAX_QTY);
      } else if (cart.savedItems.length < MAX_SAVED_ITEMS) {
        cart.savedItems.push({ product: product._id, quantity: clampQty(guestItem.quantity), size, color });
      }
    }

    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

// @route POST /api/cart/:itemId/save   (Private) — cart se shelf mein
const saveForLater = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const existing = cart.savedItems.find((s) => sameVariant(s, item.product, item.size, item.color));
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, MAX_QTY);
    } else {
      if (cart.savedItems.length >= MAX_SAVED_ITEMS) {
        return res.status(400).json({ message: `You can save up to ${MAX_SAVED_ITEMS} items for later` });
      }
      cart.savedItems.push({
        product: item.product,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });
    }

    item.deleteOne();
    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

// @route POST /api/cart/saved/:itemId/move   (Private) — shelf se wapas cart mein
const moveSavedToCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const saved = cart.savedItems.id(req.params.itemId);
    if (!saved) {
      return res.status(404).json({ message: "Saved item not found" });
    }

    const product = await Product.findById(saved.product);

    // Product ab maujood nahi ya chhupa diya gaya: shelf se hata dete hain
    if (!product || product.status === "draft") {
      saved.deleteOne();
      await cart.save();
      return res.status(404).json({
        message: "This product is no longer available, so it was removed from your saved items",
      });
    }
    if (product.status === "out_of_stock" || product.stock < 1) {
      return res.status(400).json({ message: `${product.name} is out of stock right now` });
    }

    const existing = cart.items.find((item) => sameVariant(item, saved.product, saved.size, saved.color));
    const desired = (existing ? existing.quantity : 0) + saved.quantity;
    const finalQuantity = Math.min(desired, product.stock);

    if (existing) {
      existing.quantity = finalQuantity;
    } else {
      cart.items.push({
        product: saved.product,
        quantity: finalQuantity,
        size: saved.size,
        color: saved.color,
      });
    }

    saved.deleteOne();
    await cart.save();

    const populated = await populateCart(cart);
    res.json({ ...populated.toObject(), adjusted: finalQuantity < desired });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/cart/saved/:itemId   (Private) — shelf se hamesha ke liye
const removeSavedItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const saved = cart.savedItems.id(req.params.itemId);
    if (!saved) {
      return res.status(404).json({ message: "Saved item not found" });
    }
    saved.deleteOne();
    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
  saveForLater,
  moveSavedToCart,
  removeSavedItem,
};