const LoginAttempt = require("../models/LoginAttempt");

const MAX_ATTEMPTS = 5; // itni galat koshishon ke baad lock
const WINDOW_MS = 15 * 60 * 1000; // galat koshishen is muddat tak yaad rehti hain
const LOCK_MS = 15 * 60 * 1000; // lock kitni der rahega

const recordFailure = async (key) => {
  const now = new Date();

  // Purana record (lock ya muddat khatam) saaf kar ke nayi ginti shuru
  await LoginAttempt.deleteOne({
    key,
    $or: [{ lockUntil: { $lte: now } }, { expireAt: { $lte: now } }],
  });

  const record = await LoginAttempt.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $set: { expireAt: new Date(now.getTime() + WINDOW_MS) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (record.count >= MAX_ATTEMPTS && !record.lockUntil) {
    record.lockUntil = new Date(now.getTime() + LOCK_MS);
    record.expireAt = new Date(record.lockUntil.getTime() + 60 * 1000);
    await record.save();
  }
};

// Login route par controller se PEHLE lagta hai
const loginProtection = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    // Email text hi hona chahiye (object bhej kar database ko dhokha dene se bachao)
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const key = email.trim().toLowerCase().slice(0, 254);
    if (!key) return next(); // khali email ka jawab controller dega

    const record = await LoginAttempt.findOne({ key });
    if (record?.lockUntil && record.lockUntil > new Date()) {
      const seconds = Math.ceil((record.lockUntil.getTime() - Date.now()) / 1000);
      const minutes = Math.ceil(seconds / 60);
      res.set("Retry-After", String(seconds));
      return res.status(429).json({
        message: `Too many failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      });
    }

    // Controller ka jawab jaane ke baad nateeja darj karte hain:
    // 401 (galat email/password) = ginti barhao, 200 (kamyab) = ginti saaf
    res.on("finish", () => {
      let task = null;
      if (res.statusCode === 401) task = recordFailure(key);
      else if (res.statusCode === 200) task = LoginAttempt.deleteOne({ key });

      if (task) {
        task.catch((error) => console.error("Login attempt tracking failed:", error.message));
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = loginProtection;