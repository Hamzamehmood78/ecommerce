const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { notifyStaff } = require("../utils/notify");

// Product ka average rating aur count recalculate karta hai
const recalcProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: stats[0]?.avgRating || 0,
    numReviews: stats[0]?.count || 0,
  });
};

// @route GET /api/reviews/product/:productId   (Public)
const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate("user", "name")
      .sort({ helpfulVotes: -1, createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/reviews/can-review/:productId   (Private) — kya yeh user review likh sakta hai
const canReview = async (req, res, next) => {
  try {
    const alreadyReviewed = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (alreadyReviewed) {
      return res.json({ canReview: false, reason: "already_reviewed" });
    }

    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: "delivered",
      "items.product": req.params.productId,
    });

    if (!deliveredOrder) {
      return res.json({ canReview: false, reason: "not_purchased" });
    }

    res.json({ canReview: true, orderId: deliveredOrder._id });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/reviews   (Private)   body: { productId, rating, comment, images }
const createReview = async (req, res, next) => {
  try {
        const { productId, rating, comment } = req.body;

    // Sirf apne Cloudinary ki tasveeren (zyada se zyada 3), baaqi remove hujaein gi
    const cloudPrefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
    const images = (Array.isArray(req.body.images) ? req.body.images : [])
      .filter((url) => typeof url === "string" && url.startsWith(cloudPrefix))
      .slice(0, 3);

    if (!productId || !rating || !comment?.trim()) {
      return res.status(400).json({ message: "Product, rating and comment are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: "delivered",
      "items.product": productId,
    });
    if (!deliveredOrder) {
      return res.status(403).json({ message: "You can only review products you have purchased and received" });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: deliveredOrder._id,
      rating,
      comment: comment.trim(),
      images,
      isVerifiedPurchase: true,
    });

    await recalcProductRating(productId);
    const reviewedProduct = await Product.findById(productId).select("name");
    notifyStaff("reviews", {
      type: "review",
      title: "New review",
      message: `${req.user.name} reviewed ${reviewedProduct?.name || "a product"} (${rating}★)`,
      link: "/admin/reviews",
    });
    const populated = await review.populate("user", "name");
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    next(error);
  }
};

// @route PUT /api/reviews/:id/helpful   (Private) — toggle vote
const toggleHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = req.user._id.toString();
    const idx = review.helpfulVotes.findIndex((id) => id.toString() === userId);

    if (idx > -1) {
      review.helpfulVotes.splice(idx, 1);
    } else {
      review.helpfulVotes.push(req.user._id);
    }

    await review.save();
    res.json({ helpfulCount: review.helpfulVotes.length, voted: idx === -1 });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/reviews/admin/all   (Admin)
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("product", "name slug")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/reviews/:id/moderate   (Admin)   body: { isApproved }
const moderateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    review.isApproved = req.body.isApproved;
    await review.save();
    await recalcProductRating(review.product);
    res.json(review);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/reviews/:id/reply   (Admin)   body: { text }
const replyToReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    review.adminReply = { text: req.body.text, repliedAt: new Date() };
    await review.save();
    res.json(review);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/reviews/:id   (Admin)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    const productId = review.product;
    await review.deleteOne();
    await recalcProductRating(productId);
    res.json({ message: "Review deleted" });
  } catch (error) {
    next(error);
  }
};
// @route GET /api/reviews/featured   (Public) — Home ke testimonials ke liye
const getFeaturedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      isApproved: true,
      rating: { $gte: 4 },
      $expr: { $gte: [{ $strLenCP: "$comment" }, 20] }, // bohot chhote jumle nahi
    })
      .populate("user", "name")
      .populate("product", "name slug")
      .sort({ createdAt: -1 })
      .limit(9);

    // Poora naam nahi, sirf "Ali K." (privacy)
    const displayName = (fullName) => {
      const parts = (fullName || "Customer").trim().split(/\s+/);
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
    };

    res.json(
      reviews.map((r) => ({
        _id: r._id,
        rating: r.rating,
        comment: r.comment.length > 220 ? `${r.comment.slice(0, 217)}...` : r.comment,
        name: displayName(r.user?.name),
        isVerifiedPurchase: r.isVerifiedPurchase,
        productName: r.product?.name || "",
        productSlug: r.product?.slug || "",
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};
module.exports = {
    getFeaturedReviews,
  getProductReviews,
  canReview,
  createReview,
  toggleHelpful,
  getAllReviewsAdmin,
  moderateReview,
  replyToReview,
  deleteReview,
};