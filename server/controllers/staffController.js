const User = require("../models/User");
const { PERMISSIONS } = require("../utils/permissions");

const emailRegex = /^\S+@\S+\.\S+$/;

// Sirf valid permission names rakhta hai, duplicate hata deta hai
const cleanPermissions = (list) =>
  Array.isArray(list) ? [...new Set(list.filter((p) => PERMISSIONS.includes(p)))] : [];

const toPublic = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: user.permissions,
  createdAt: user.createdAt,
});

// @route GET /api/staff   (Super Admin)
const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: "staff" }).select("-password").sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/staff   (Super Admin)   body: { name, email, password, permissions }
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, permissions } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const staff = await User.create({
      name: name.trim(),
      email,
      password,
      role: "staff",
      permissions: cleanPermissions(permissions),
    });

    res.status(201).json(toPublic(staff));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/staff/:id   (Super Admin)   body: { name, permissions, password }
const updateStaff = async (req, res, next) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const { name, permissions, password } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      staff.name = name.trim();
    }
    if (permissions !== undefined) {
      staff.permissions = cleanPermissions(permissions);
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      staff.password = password;
    }

    await staff.save();
    res.json(toPublic(staff));
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/staff/:id   (Super Admin)
const deleteStaff = async (req, res, next) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    await staff.deleteOne();
    res.json({ message: "Staff member removed" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };