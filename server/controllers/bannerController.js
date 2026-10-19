const Banner = require("../models/Banner");

// @route GET /api/banners   (Public)
const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/banners/admin/all   (Admin)
const getAllBannersAdmin = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/banners   (Admin)
const createBanner = async (req, res, next) => {
  try {
    const { image, heading, subtext, buttonText, link } = req.body;
    if (!image || !heading?.trim()) {
      return res.status(400).json({ message: "Image and heading are required" });
    }

    const maxOrder = await Banner.findOne().sort({ order: -1 }).select("order");
    const banner = await Banner.create({
      image, heading, subtext, buttonText, link,
      order: (maxOrder?.order ?? -1) + 1,
    });
    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/banners/:id   (Admin)
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    const fields = ["image", "heading", "subtext", "buttonText", "link", "isActive"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) banner[f] = req.body[f];
    });
    const updated = await banner.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/banners/:id   (Admin)
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    await banner.deleteOne();
    res.json({ message: "Banner deleted" });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/banners/reorder   (Admin)   body: { orderedIds: [...] }
const reorderBanners = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds must be an array" });
    }
    await Promise.all(
      orderedIds.map((id, index) => Banner.findByIdAndUpdate(id, { order: index }))
    );
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

module.exports = { getBanners, getAllBannersAdmin, createBanner, updateBanner, deleteBanner, reorderBanners };