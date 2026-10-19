const mongoose = require("mongoose");

// Har email ke galat login ka hisaab. Khud-ba-khud mit jata hai (TTL index).
const loginAttemptSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // email (chhote harf mein)
  count: { type: Number, default: 0 },
  lockUntil: { type: Date },
  expireAt: { type: Date, index: { expires: 0 } },
});

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);