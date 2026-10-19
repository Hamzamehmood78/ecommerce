const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

const populateWishlist = (wishlist) =>
  wishlist.populate({
    path: "products",
    select: "name slug price discountPrice images stock status rating numReviews",
  });

// @route GET /api/wishlist   (Private)
const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await getOrCreateWishlist(req.user._id);
    wishlist = await populateWishlist(wishlist);
    res.json(wishlist);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/wishlist   (Private)  body: { productId }
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Product is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);
    const alreadyExists = wishlist.products.some((id) => id.toString() === productId);

    if (!alreadyExists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const populated = await populateWishlist(wishlist);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/wishlist/:productId   (Private)
const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== req.params.productId
    );
    await wishlist.save();

    const populated = await populateWishlist(wishlist);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };