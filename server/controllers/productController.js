const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { generateUniqueSlug } = require("../utils/slugify");
const sendEmail = require("../utils/sendEmail");
const { logStockChange } = require("../utils/stockLog");
const { notifyWishlistPriceDrop } = require("../utils/notify");

const PUBLIC_STATUSES = ["active", "out_of_stock"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPagination = (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || 12, 1), 50);
    return { page, limit };
};

// @route GET /api/products   (Public)
// Query: keyword, category (id ya slug), brand, minPrice, maxPrice, sort, page, limit
const getProducts = async (req, res, next) => {
    try {
    const { keyword, category, brand, size, color, minRating, minPrice, maxPrice, sort } = req.query;        const { page, limit } = getPagination(req.query);

        const filter = { status: { $in: PUBLIC_STATUSES } };
        if (req.query.ids) {
            const idsArray = req.query.ids.split(",").filter(Boolean);
            filter._id = { $in: idsArray };
        }

        if (keyword && keyword.trim()) {
            const regex = new RegExp(escapeRegex(keyword.trim()), "i");
            filter.$or = [{ name: regex }, { brand: regex }];
        }

        if (category) {
            const cat = await Category.findOne(
                mongoose.isValidObjectId(category) ? { _id: category } : { slug: category }
            );
            if (!cat) {
                return res.json({ products: [], page, pages: 0, total: 0 });
            }
            // Category + uski subcategories dono ke products
            const children = await Category.find({ parent: cat._id }).select("_id");
            filter.category = { $in: [cat._id, ...children.map((c) => c._id)] };
        }

          // "Nike,Adidas" jaisi list; text ke ilawa kuch aaye to nazar-andaz
    const asList = (value) =>
      typeof value === "string" ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

    if (asList(brand).length) filter.brand = { $in: asList(brand) };
    if (asList(size).length) filter.sizes = { $in: asList(size) };
    if (asList(color).length) filter.colors = { $in: asList(color) };
    if (Number(minRating) > 0) filter.rating = { $gte: Number(minRating) };

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const sortOptions = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            newest: { createdAt: -1 },
            popular: { soldCount: -1 },
            rating: { rating: -1 },
        };
        const sortBy = sortOptions[sort] || sortOptions.newest;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug")
                .sort(sortBy)
                .skip((page - 1) * limit)
                .limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({ products, page, pages: Math.ceil(total / limit), total });
    } catch (error) {
        next(error);
    }
};

// @route GET /api/products/:idOrSlug   (Public - draft nazar nahi aata)
const getProductByIdOrSlug = async (req, res, next) => {
    try {
        const { idOrSlug } = req.params;
        const query = mongoose.isValidObjectId(idOrSlug)
            ? { _id: idOrSlug }
            : { slug: idOrSlug };

        const product = await Product.findOne({
            ...query,
            status: { $in: PUBLIC_STATUSES },
        }).populate("category", "name slug");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        next(error);
    }
};

// @route GET /api/products/admin/all   (Admin - draft bhi)
// Query: keyword, status, category, page, limit
const getAdminProducts = async (req, res, next) => {
    try {
            const { keyword, status, category, sortBy, order } = req.query;

    // Sirf in columns par sort hone dete hain
    const SORT_FIELDS = { name: "name", price: "price", stock: "stock", date: "createdAt" };
    const adminSort = { [SORT_FIELDS[sortBy] || "createdAt"]: order === "asc" ? 1 : -1 };
        const { page, limit } = getPagination(req.query);

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (keyword && keyword.trim()) {
            const regex = new RegExp(escapeRegex(keyword.trim()), "i");
            filter.$or = [{ name: regex }, { brand: regex }, { sku: regex }];
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug")
                        .sort(adminSort)
                .skip((page - 1) * limit)
                .limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({ products, page, pages: Math.ceil(total / limit), total });
    } catch (error) {
        next(error);
    }
};

// @route GET /api/products/admin/:id   (Admin)
const getAdminProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate(
            "category",
            "name slug"
        );
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        next(error);
    }
};

// @route POST /api/products   (Admin)
const createProduct = async (req, res, next) => {
    try {
        const {
            name, description, category, brand, price, discountPrice, sku, stock,
            sizes, colors, images, isFeatured, status, seoTitle, seoDescription,
        } = req.body;

        if (!name || !description || !category || price === undefined) {
            return res.status(400).json({
                message: "Name, description, category and price are required",
            });
        }

        const cat = await Category.findById(category);
        if (!cat) {
            return res.status(400).json({ message: "Category not found" });
        }

        if (discountPrice && Number(discountPrice) >= Number(price)) {
            return res
                .status(400)
                .json({ message: "Discount price must be less than the regular price" });
        }

        if (sku && (await Product.findOne({ sku }))) {
            return res.status(400).json({ message: "SKU already exists" });
        }

        const slug = await generateUniqueSlug(Product, name);

        const product = await Product.create({
            name, slug, description, category, brand, price, discountPrice,
            sku: sku || undefined,
            stock, sizes, colors, images, isFeatured, status, seoTitle, seoDescription,
        });
            if (product.stock > 0) {
      await logStockChange({
        product: product._id,
        previousStock: 0,
        newStock: product.stock,
        reason: "Initial stock when product was created",
        source: "initial",
        user: req.user._id,
      });
    }

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/products/:id   (Admin)
const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const oldName = product.name;
        const oldSku = product.sku;
            const wasOutOfStock = product.stock === 0 || product.status === "out_of_stock";
                const oldStock = product.stock;
                    const oldEffectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

        const fields = [
            "name", "description", "category", "brand", "price", "discountPrice",
            "stock", "sizes", "colors", "images", "isFeatured", "status",
            "seoTitle", "seoDescription",
        ];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) product[field] = req.body[field];
        });

        if (req.body.category !== undefined) {
            const cat = await Category.findById(req.body.category);
            if (!cat) {
                return res.status(400).json({ message: "Category not found" });
            }
        }

        if (req.body.sku !== undefined) {
            const newSku = req.body.sku || undefined;
            if (newSku && newSku !== oldSku && (await Product.findOne({ sku: newSku }))) {
                return res.status(400).json({ message: "SKU already exists" });
            }
            product.sku = newSku;
        }

        if (product.discountPrice && product.discountPrice >= product.price) {
            return res
                .status(400)
                .json({ message: "Discount price must be less than the regular price" });
        }

        if (product.name !== oldName) {
            product.slug = await generateUniqueSlug(Product, product.name, product._id);
        }

          const updated = await product.save();
              await logStockChange({
      product: updated._id,
      previousStock: oldStock,
      newStock: updated.stock,
      reason: "Stock edited from product form",
      source: "product_edit",
      user: req.user._id,
    });
    const newEffectivePrice = updated.discountPrice > 0 ? updated.discountPrice : updated.price;
    if (newEffectivePrice < oldEffectivePrice) {
      notifyWishlistPriceDrop(updated, oldEffectivePrice, newEffectivePrice);
    }
    const isBackInStock = wasOutOfStock && updated.stock > 0 && updated.status !== "out_of_stock";
    if (isBackInStock && updated.notifyList.length > 0) {
      updated.notifyList.forEach((email) => {
        sendEmail({
          to: email,
          subject: `Back in Stock: ${updated.name} - ShopEase`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
              <h2 style="color: #0F766E;">Good news!</h2>
              <p><strong>${updated.name}</strong> is back in stock.</p>
              <p>Grab it before it sells out again.</p>
            </div>
          `,
        });
      });
      updated.notifyList = [];
      await updated.save();
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/products/:id/notify-me   (Public)   body: { email }
const notifyMe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.notifyList.includes(email)) {
      product.notifyList.push(email);
      await product.save();
    }

    res.json({ message: "You'll be notified when this product is back in stock" });
  } catch (error) {
    next(error);
  }
};



// @route DELETE /api/products/:id   (Admin)
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        await product.deleteOne();
        res.json({ message: "Product deleted" });
    } catch (error) {
        next(error);
    }
};
// @route GET /api/products/suggestions?q=   (Public) — search box ki live suggestions
const getSuggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.json({ products: [], categories: [], brands: [] });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const [products, categories, brands] = await Promise.all([
      Product.find({ status: { $in: PUBLIC_STATUSES }, $or: [{ name: regex }, { brand: regex }] })
        .select("name slug images price discountPrice")
        .sort({ soldCount: -1 })
        .limit(5),
      Category.find({ isActive: true, name: regex }).select("name slug").limit(3),
      Product.distinct("brand", { status: { $in: PUBLIC_STATUSES }, brand: regex }),
    ]);

    res.json({ products, categories, brands: brands.filter(Boolean).slice(0, 3) });
  } catch (error) {
    next(error);
  }
};
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// S, M, L ko sahi tarteeb mein, baaki (jaise 30, 32, 34) number ke hisaab se
const sortSizes = (list) =>
  list.sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

// @route GET /api/products/filter-options   (Public) — Shop ke filters ki list
const getFilterOptions = async (req, res, next) => {
  try {
    const match = { status: { $in: PUBLIC_STATUSES } };
    const [brands, sizes, colors] = await Promise.all([
      Product.distinct("brand", match),
      Product.distinct("sizes", match),
      Product.distinct("colors", match),
    ]);

    const byName = (list) => list.filter(Boolean).sort((a, b) => a.localeCompare(b));

    res.json({
      brands: byName(brands),
      sizes: sortSizes(sizes.filter(Boolean)),
      colors: byName(colors),
    });
  } catch (error) {
    next(error);
  }
};
const BULK_ACTIONS = ["delete", "activate", "deactivate", "export"];

// @route POST /api/products/bulk   body: { action, ids: [...] }   (Products permission)
const bulkProductAction = async (req, res, next) => {
  try {
    const { action, ids } = req.body;

    if (!BULK_ACTIONS.includes(action)) {
      return res.status(400).json({ message: "Invalid bulk action" });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Select at least one product" });
    }
    if (ids.length > 500) {
      return res.status(400).json({ message: "You can select up to 500 products at a time" });
    }

    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid products selected" });
    }

    if (action === "export") {
      const products = await Product.find({ _id: { $in: validIds } })
        .populate("category", "name")
        .sort({ name: 1 });
      return res.json({ products });
    }

    if (action === "delete") {
      const result = await Product.deleteMany({ _id: { $in: validIds } });
      return res.json({ affected: result.deletedCount });
    }

    // activate = store par nazar aaye, deactivate = Draft (chhupa hua)
    const status = action === "activate" ? "active" : "draft";
    const result = await Product.updateMany({ _id: { $in: validIds } }, { status });
    res.json({ affected: result.matchedCount });
  } catch (error) {
    next(error);
  }
};
module.exports = {
      bulkProductAction,
      getFilterOptions,
  getProducts,
  getProductByIdOrSlug,
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  notifyMe,
    getSuggestions,
};