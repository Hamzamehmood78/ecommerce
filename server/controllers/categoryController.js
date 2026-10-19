const Category = require("../models/Category");
const Product = require("../models/Product");
const { generateUniqueSlug } = require("../utils/slugify");

// Case-insensitive duplicate name check
const nameExists = (name, excludeId = null) =>
  Category.findOne({
    name,
    ...(excludeId && { _id: { $ne: excludeId } }),
  }).collation({ locale: "en", strength: 2 });

// @route GET /api/categories   (Public - sirf active)
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/categories/admin/all   (Admin - active + hidden)
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/categories/:id   (Public)
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("parent", "name slug");

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/categories   (Admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, image, parent, description, isActive, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    if (await nameExists(name.trim())) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    const slug = await generateUniqueSlug(Category, name);

    const category = await Category.create({
      name,
      slug,
      image,
      parent: parent || null,
      description,
      isActive,
      sortOrder,
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/categories/:id   (Admin)
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, image, parent, description, isActive, sortOrder } = req.body;

    if (name !== undefined && name.trim() !== category.name) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Category name cannot be empty" });
      }
      if (await nameExists(name.trim(), category._id)) {
        return res.status(400).json({ message: "Category name already exists" });
      }
      category.name = name;
      category.slug = await generateUniqueSlug(Category, name, category._id);
    }

    if (parent !== undefined) {
      if (parent === "" || parent === null) {
        category.parent = null;
      } else {
        if (String(parent) === String(category._id)) {
          return res
            .status(400)
            .json({ message: "A category cannot be its own parent" });
        }
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
          return res.status(400).json({ message: "Parent category not found" });
        }
        category.parent = parent;
      }
    }

    if (image !== undefined) category.image = image;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/categories/:id   (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) are assigned to this category`,
      });
    }

    const childCount = await Category.countDocuments({ parent: category._id });
    if (childCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: this category has ${childCount} subcategory(ies)`,
      });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    next(error);
  }
};
// @route PUT /api/categories/reorder   body: { orderedIds: [...] }   (Categories permission)
// Ek hi level (siblings) ki categories ka naya order
const reorderCategories = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const { orderedIds } = req.body;

    if (
      !Array.isArray(orderedIds) ||
      orderedIds.length === 0 ||
      orderedIds.length > 200 ||
      !orderedIds.every((id) => mongoose.isValidObjectId(id))
    ) {
      return res.status(400).json({ message: "A valid list of category IDs is required" });
    }

    await Promise.all(
      orderedIds.map((id, index) => Category.findByIdAndUpdate(id, { sortOrder: index }))
    );

    res.json({ message: "Category order saved" });
  } catch (error) {
    next(error);
  }
};
module.exports = {
    reorderCategories,
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};