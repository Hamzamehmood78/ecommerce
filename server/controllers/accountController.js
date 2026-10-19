const User = require("../models/User");

const emailRegex = /^\S+@\S+\.\S+$/;
const MAX_ADDRESSES = 10;
const ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "addressLine2", "city", "state", "zip"];
const REQUIRED_ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "city", "zip"];

const publicProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  avatar: user.avatar || "",
  role: user.role,
});

const missingAddressField = (body) =>
  REQUIRED_ADDRESS_FIELDS.find((field) => !body[field] || !String(body[field]).trim());

const pickAddress = (body) =>
  ADDRESS_FIELDS.reduce((acc, field) => {
    acc[field] = body[field] !== undefined ? String(body[field]).trim() : "";
    return acc;
  }, {});

// @route GET /api/account/profile
const getProfile = async (req, res) => {
  res.json(publicProfile(req.user));
};

// @route PUT /api/account/profile   body: { name, email, phone, avatar }
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, email, phone, avatar } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      const newEmail = email.trim().toLowerCase();
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: "Please enter a valid email" });
      }
      if (newEmail !== user.email) {
        const taken = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({ message: "This email is already in use" });
        }
        user.email = newEmail;
      }
    }

    if (phone !== undefined) user.phone = String(phone).trim();

    if (avatar !== undefined) {
      if (avatar && !/^https:\/\//.test(avatar)) {
        return res.status(400).json({ message: "Invalid image URL" });
      }
      user.avatar = avatar;
    }

    await user.save();
    res.json(publicProfile(user));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/account/password   body: { currentPassword, newPassword }
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the current one" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/account/addresses
const getAddresses = async (req, res) => {
  res.json(req.user.addresses);
};

// @route POST /api/account/addresses
const addAddress = async (req, res, next) => {
  try {
    const missing = missingAddressField(req.body);
    if (missing) {
      return res.status(400).json({ message: `${missing} is required` });
    }

    const user = req.user;
    if (user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses` });
    }

    // Pehla address khud-ba-khud default ban jata hai
    const makeDefault = req.body.isDefault === true || user.addresses.length === 0;
    if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));

    user.addresses.push({ ...pickAddress(req.body), isDefault: makeDefault });
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/account/addresses/:addressId
const updateAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const missing = missingAddressField(req.body);
    if (missing) {
      return res.status(400).json({ message: `${missing} is required` });
    }

    Object.assign(address, pickAddress(req.body));

    // Default hamesha ek hona chahiye, isliye sirf "true" par dhyan dete hain
    if (req.body.isDefault === true) {
      user.addresses.forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/account/addresses/:addressId/default
const setDefaultAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/account/addresses/:addressId
const deleteAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // Default hata to agla address default ban jaye
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};