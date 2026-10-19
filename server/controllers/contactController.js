const ContactMessage = require("../models/ContactMessage");
const { notifyStaff } = require("../utils/notify");
// @route POST /api/contact   (Public)
const sendMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await ContactMessage.create({ name, email, subject, message });
        notifyStaff("messages", {
      type: "message",
      title: "New contact message",
      message: `${name}: ${subject}`,
      link: "/admin/messages",
    });
    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/contact/admin/all   (Admin)
const getMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/contact/:id/read   (Admin)
const markRead = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }
    res.json(msg);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/contact/:id   (Admin)
const deleteMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }
    await msg.deleteOne();
    res.json({ message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages, markRead, deleteMessage };