const Order = require("../models/Order");
const Review = require("../models/Review");

// Kya yeh user is product ka review (aur photo) de sakta hai?
// Haan: product khareeda aur mil gaya (delivered), aur abhi review nahi likha
const getReviewEligibility = async (userId, productId) => {
  const alreadyReviewed = await Review.exists({ product: productId, user: userId });
  if (alreadyReviewed) return { canReview: false, reason: "already_reviewed" };

  const delivered = await Order.exists({
    user: userId,
    status: "delivered",
    "items.product": productId,
  });
  if (!delivered) return { canReview: false, reason: "not_purchased" };

  return { canReview: true };
};

module.exports = { getReviewEligibility };