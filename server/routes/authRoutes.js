const express = require("express");
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { forgotPassword, checkResetToken, resetPassword } = require("../controllers/passwordController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter, passwordResetLimiter } = require("../middleware/rateLimiters");
const loginProtection = require("../middleware/loginProtection");

const router = express.Router();

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginProtection, loginUser);
router.get("/me", protect, getMe);

router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.get("/reset-password/:token", checkResetToken);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);

module.exports = router;