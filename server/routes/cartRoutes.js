const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
  saveForLater,
  moveSavedToCart,
  removeSavedItem,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // Cart ke saare routes login zaroori karte hain

router.get("/", getCart);
router.post("/", addToCart);
router.post("/merge", mergeCart);
router.delete("/", clearCart);

// Shelf ke routes ("/saved/..." ko "/:itemId" wale routes se pehle rakha hai)
router.post("/saved/:itemId/move", moveSavedToCart);
router.delete("/saved/:itemId", removeSavedItem);

router.post("/:itemId/save", saveForLater);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);

module.exports = router;