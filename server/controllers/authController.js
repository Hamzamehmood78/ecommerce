const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const emailRegex = /^\S+@\S+\.\S+$/;

// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

     const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      // Guest ne is email se order kiya tha: seedha account dena khatarnak hai (koi aur
      // kisi ke email se aa kar uske purane orders dekh sakta). Pehle email ki tasdeeq.
      if (userExists.isGuest) {
        return res.status(409).json({
          message:
            'You have ordered as a guest with this email. Use "Forgot Password" on the login page to set a password and link your past orders.',
        });
      }
      return res.status(400).json({ message: "Email is already registered" });
    }

    // role yahan se set nahi hota, hamesha "customer" hi banega
    const user = await User.create({ name, email, phone, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account has been blocked. Contact support." });
    }

      res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @access  Private (login zaroori)
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };