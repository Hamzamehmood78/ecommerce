const crypto = require("crypto");
const User = require("../models/User");

const emailRegex = /^\S+@\S+\.\S+$/;

// Guest checkout ke liye email ki jaanch (payment se PEHLE)
const checkGuestEmail = async (rawEmail) => {
  const email = String(rawEmail || "").trim().toLowerCase().slice(0, 254);

  if (!emailRegex.test(email)) {
    return { error: { status: 400, message: "Please enter a valid email" } };
  }

  const existing = await User.findOne({ email });

  // Asli account wali email se guest order nahi ho sakta
  if (existing && !existing.isGuest) {
    return {
      error: {
        status: 409,
        message: "An account already exists with this email. Please log in to continue.",
      },
    };
  }
  if (existing?.isBlocked) {
    return {
      error: { status: 403, message: "Orders cannot be placed with this email. Please contact support." },
    };
  }

  return { email, existing };
};

// Guest ka "account" (bina asli password ke). Baad mein Forgot Password se asli ban sakta hai.
const getOrCreateGuest = async ({ email, name, phone }) => {
  const existing = await User.findOne({ email });
  if (existing) return existing;

  try {
    return await User.create({
      name: String(name).trim(),
      email,
      phone: String(phone || "").trim(),
      password: crypto.randomBytes(24).toString("hex"), // kisi ko nahi bataya jata
      isGuest: true,
    });
  } catch (error) {
    // Do requests ek saath aayin: doosri ne pehle bana diya
    if (error.code === 11000) {
      const created = await User.findOne({ email });
      if (created) return created;
    }
    throw error;
  }
};

module.exports = { checkGuestEmail, getOrCreateGuest };