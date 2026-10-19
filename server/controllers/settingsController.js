const SiteSettings = require("../models/SiteSettings");
const {
  DEFAULT_TEMPLATES,
  TEMPLATE_LABELS,
  PLACEHOLDERS,
  effectiveTemplates,
} = require("../utils/emailTemplates");
const { CURRENCIES } = require("../utils/currency");

const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  return settings;
};

const populateSettings = (settings) =>
  settings.populate([
    { path: "featuredProductIds", select: "name slug price discountPrice images stock status rating numReviews" },
    { path: "dealProductIds", select: "name slug price discountPrice images stock status rating numReviews" },
  ]);

// @route GET /api/settings   (Public) — gateway keys aur email templates yahan se nahi jate
const getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const populated = await populateSettings(settings);
    const data = populated.toObject();
    delete data.paymentGateways;
    delete data.emailTemplates;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/settings/admin   (Payments permission) — poori settings, gateway keys ke saath
const getSettingsAdmin = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const populated = await populateSettings(settings);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/settings/email-templates   (Store Settings permission)
const getEmailTemplates = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const saved = settings.emailTemplates ? settings.emailTemplates.toObject() : {};
    res.json({
      templates: effectiveTemplates(saved),
      defaults: DEFAULT_TEMPLATES,
      labels: TEMPLATE_LABELS,
      placeholders: PLACEHOLDERS,
    });
  } catch (error) {
    next(error);
  }
};

// Har field kis permission se badli ja sakti hai
const FIELD_PERMISSION = {
  featuredProductIds: "homepage",
  dealProductIds: "homepage",
  sections: "homepage",
  store: "settings",
  policies: "settings",
  tax: "settings",
  currency: "settings",
  emailTemplates: "settings",
  shippingRates: "shipping",
  paymentGateways: "payments",
};

const oneLine = (value, max) => String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

// @route PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      const userPerms = req.user.permissions || [];
      const denied = Object.keys(req.body).filter(
        (key) => FIELD_PERMISSION[key] && !userPerms.includes(FIELD_PERMISSION[key])
      );
      if (denied.length > 0) {
        return res.status(403).json({ message: "You do not have permission to change these settings" });
      }
    }

    const settings = await getOrCreateSettings();
    const {
      featuredProductIds,
      dealProductIds,
      sections,
      store,
      policies,
      tax,
      currency,
      emailTemplates,
      shippingRates,
      paymentGateways,
    } = req.body;

    if (currency !== undefined) {
      const code = String(currency?.code || "").toUpperCase();
      if (!CURRENCIES[code]) {
        return res.status(400).json({ message: "Unsupported currency" });
      }
      settings.currency = { code };
    }

    if (tax !== undefined) {
      if (typeof tax !== "object" || tax === null) {
        return res.status(400).json({ message: "Invalid tax settings" });
      }
      const rate = Number(tax.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({ message: "Tax rate must be a number between 0 and 100" });
      }
      settings.tax = {
        enabled: Boolean(tax.enabled),
        rate,
        label: String(tax.label || "Tax").trim().slice(0, 20) || "Tax",
      };
    }

    if (emailTemplates !== undefined) {
      if (typeof emailTemplates !== "object" || emailTemplates === null) {
        return res.status(400).json({ message: "Invalid email templates" });
      }
      const cleaned = {};
      for (const key of Object.keys(DEFAULT_TEMPLATES)) {
        const t = emailTemplates[key];
        if (t === undefined) continue;
        if (typeof t !== "object" || t === null) {
          return res.status(400).json({ message: `Invalid template: ${key}` });
        }
        cleaned[key] = {
          subject: oneLine(t.subject, 150),
          heading: oneLine(t.heading, 100),
          message: String(t.message ?? "").trim().slice(0, 2000),
        };
      }
      settings.emailTemplates = { ...settings.emailTemplates.toObject(), ...cleaned };
    }

    if (featuredProductIds !== undefined) settings.featuredProductIds = featuredProductIds;
    if (dealProductIds !== undefined) settings.dealProductIds = dealProductIds;
    if (sections !== undefined) settings.sections = { ...settings.sections.toObject(), ...sections };
    if (store !== undefined) settings.store = { ...settings.store.toObject(), ...store };
    if (policies !== undefined) settings.policies = { ...settings.policies.toObject(), ...policies };
    if (shippingRates !== undefined) settings.shippingRates = { ...settings.shippingRates.toObject(), ...shippingRates };
    if (paymentGateways !== undefined) settings.paymentGateways = { ...settings.paymentGateways.toObject(), ...paymentGateways };

    await settings.save();
    const populated = await populateSettings(settings);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, getSettingsAdmin, getEmailTemplates, updateSettings };