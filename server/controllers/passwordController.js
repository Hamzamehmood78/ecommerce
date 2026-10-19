const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const emailRegex = /^\S+@\S+\.\S+$/;
const RESET_TTL_MS = 30 * 60 * 1000; // link 30 minute tak valid
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 second se pehle dobara email nahi

// Database mein sirf hash rakhte hain, asli token sirf email ke link mein hota hai
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const findUserByToken = (token) =>
  User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });

// @route POST /api/auth/forgot-password   body: { email }
// Guest ke liye yehi raasta "account banane" ka hai (email ka malik hone ki tasdeeq ke saath)
const forgotPassword = async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // Email registered ho ya na ho, jawab hamesha yehi hota hai
    const genericResponse = {
      message: "If an account exists for this email, a reset link has been sent.",
    };

    const user = await User.findOne({ email }).select("+resetPasswordExpires");
    if (!user || user.isBlocked) {
      return res.json(genericResponse);
    }

    if (user.resetPasswordExpires) {
      const issuedAt = user.resetPasswordExpires.getTime() - RESET_TTL_MS;
      if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) {
        return res.json(genericResponse);
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`;

    const isGuest = user.isGuest;
    sendEmail({
      to: user.email,
      subject: isGuest ? "Set up your account - ShopEase" : "Reset your password - ShopEase",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #0F766E;">${isGuest ? "Set up your account" : "Reset your password"}</h2>
          <p>${
            isGuest
              ? "Choose a password to create your ShopEase account. Your past orders will appear in it, so you can track them and check out faster."
              : "We received a request to reset the password for your ShopEase account."
          }</p>
          <p>
            <a href="${link}" style="display:inline-block;background:#0F766E;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              ${isGuest ? "Set Password" : "Reset Password"}
            </a>
          </p>
          <p style="color:#52606D;font-size:13px;">
            This link is valid for 30 minutes and can be used only once.
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/reset-password/:token   — form dikhane se pehle link ki jaanch
const checkResetToken = async (req, res, next) => {
  try {
    const user = await findUserByToken(req.params.token);
    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }
    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/reset-password/:token   body: { password }
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await findUserByToken(req.params.token);
    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }

    const wasGuest = user.isGuest;

    user.password = password;
    user.isGuest = false; // password set ho gaya: ab yeh asli account hai
    user.resetPasswordToken = undefined; // link dobara istemal na ho sake
    user.resetPasswordExpires = undefined;
    await user.save();

    sendEmail({
      to: user.email,
      subject: wasGuest ? "Your account is ready - ShopEase" : "Your password was changed - ShopEase",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #0F766E;">${wasGuest ? "Your account is ready" : "Password changed"}</h2>
          <p>${
            wasGuest
              ? "Your ShopEase account has been created. You can now log in and see your orders."
              : "The password for your ShopEase account was just changed."
          }</p>
          ${
            wasGuest
              ? ""
              : '<p style="color:#52606D;font-size:13px;">If this wasn\'t you, please reset your password again right away.</p>'
          }
        </div>
      `,
    });

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    next(error);
  }
};

module.exports = { forgotPassword, checkResetToken, resetPassword };