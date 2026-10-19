const express = require("express");
const {
  getProducts,
  getProductByIdOrSlug,
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  notifyMe,
    getSuggestions,
      getFilterOptions,
        bulkProductAction,
} = require("../controllers/productController");
const { protect, canManageProducts } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/suggestions", getSuggestions);
router.get("/filter-options", getFilterOptions);
router.post("/bulk", protect, canManageProducts, bulkProductAction);
// "/admin/..." routes "/:idOrSlug" se PEHLE hone chahiye
router.get("/admin/all", protect, canManageProducts, getAdminProducts);
router.get("/admin/:id", protect, canManageProducts, getAdminProductById);
router.get("/:idOrSlug", getProductByIdOrSlug);
router.post("/:id/notify-me", notifyMe);
router.post("/", protect, canManageProducts, createProduct);
router.put("/:id", protect, canManageProducts, updateProduct);
router.delete("/:id", protect, canManageProducts, deleteProduct);

module.exports = router;