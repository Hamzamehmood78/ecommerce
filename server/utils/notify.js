const Notification = require("../models/Notification");
const User = require("../models/User");
const Wishlist = require("../models/Wishlist");
const SiteSettings = require("../models/SiteSettings");
const { formatMoney } = require("./currency");

// Sab fire-and-forget hain: notification fail ho to asal kaam (order, review...) na ruke

// Ek khaas user ko
const notifyUser = async (userId, data) => {
  try {
    await Notification.create({ user: userId, ...data });
  } catch (error) {
    console.error("Notification failed:", error.message);
  }
};

// Super Admin ko hamesha, aur Staff ko tab jab uske paas yeh permission ho
const notifyStaff = async (permission, data) => {
  try {
    const recipients = await User.find({
      $or: [{ role: "admin" }, { role: "staff", permissions: permission }],
    }).select("_id");

    if (recipients.length > 0) {
      await Notification.insertMany(recipients.map((r) => ({ user: r._id, ...data })));
    }
  } catch (error) {
    console.error("Staff notification failed:", error.message);
  }
};

// Jin customers ki wishlist mein yeh product hai unko price drop ka alert
const notifyWishlistPriceDrop = async (product, oldPrice, newPrice) => {
  try {
    if (product.status !== "active") return;

    const wishlists = await Wishlist.find({ products: product._id }).select("user");
    if (wishlists.length === 0) return;

    const settings = await SiteSettings.findOne();
    const code = settings?.currency?.code;

    await Notification.insertMany(
      wishlists.map((w) => ({
        user: w.user,
        type: "price_drop",
        title: "Price drop on your wishlist",
        message: `${product.name} is now ${formatMoney(newPrice, code)} (was ${formatMoney(oldPrice, code)})`,
        link: `/product/${product.slug}`,
      }))
    );
  } catch (error) {
    console.error("Price drop notification failed:", error.message);
  }
};

module.exports = { notifyUser, notifyStaff, notifyWishlistPriceDrop };