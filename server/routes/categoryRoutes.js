const express = require("express");
const {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} = require("../controllers/categoryController");
const { protect, canManageCategories, canReadCategories } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getCategories);
router.get("/admin/all", protect, canReadCategories, getAllCategories);
// "/reorder" ko "/:id" se pehle hona zaroori hai
router.put("/reorder", protect, canManageCategories, reorderCategories);
router.get("/:id", getCategoryById);
router.post("/", protect, canManageCategories, createCategory);
router.put("/:id", protect, canManageCategories, updateCategory);
router.delete("/:id", protect, canManageCategories, deleteCategory);

module.exports = router;