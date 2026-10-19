const SiteSettings = require("../models/SiteSettings");
const sendEmail = require("./sendEmail");
const { formatMoney } = require("./currency");

// Admin ne kuch na likha ho (ya khali chhoda ho) to yeh alfaaz istemal hote hain
const DEFAULT_TEMPLATES = {
  order_placed: {
    subject: "Order Confirmation - {{storeName}}",
    heading: "Order Placed!",
    message: "Hi {{customerName}}, we've received your order and will begin processing it shortly.",
  },
  shipped: {
    subject: "Your order has shipped - {{storeName}}",
    heading: "Your order is on its way!",
    message: "Hi {{customerName}}, your order has been shipped.",
  },
  out_for_delivery: {
    subject: "Out for delivery - {{storeName}}",
    heading: "Out for delivery",
    message: "Hi {{customerName}}, your order is out for delivery today.",
  },
  delivered: {
    subject: "Delivered - {{storeName}}",
    heading: "Your order has been delivered",
    message: "Hi {{customerName}}, your order has been delivered. We hope you enjoy it!",
  },
};

const TEMPLATE_LABELS = {
  order_placed: "Order Confirmation",
  shipped: "Order Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Order Delivered",
};

const PLACEHOLDERS = [
  { key: "customerName", description: "Customer's name" },
  { key: "orderId", description: "Order number, e.g. #2D76A9F3" },
  { key: "total", description: "Order total, e.g. Rs 3,000" },
  { key: "trackingNumber", description: "Tracking number (empty if none)" },
  { key: "storeName", description: "Your store's name" },
];

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// {{naam}} ki jagah qeemat. Sirf jaane-pehchane naam badalte hain, baaki jaisa hai waisa rehta hai.
const fillText = (template, values, transform) =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? transform(values[name]) : match
  );

// Saved (shayad adhoori) template ko default ke saath mila kar mukammal banata hai
const effectiveTemplates = (saved = {}) => {
  const result = {};
  for (const key of Object.keys(DEFAULT_TEMPLATES)) {
    const def = DEFAULT_TEMPLATES[key];
    const s = saved?.[key] || {};
    result[key] = {
      subject: (s.subject || "").trim() || def.subject,
      heading: (s.heading || "").trim() || def.heading,
      message: (s.message || "").trim() || def.message,
    };
  }
  return result;
};

const renderEmail = async (key, order, user) => {
  const settings = await SiteSettings.findOne();
  const saved = settings?.emailTemplates ? settings.emailTemplates.toObject() : {};
  const template = effectiveTemplates(saved)[key];

  const values = {
    customerName: user.name || "Customer",
    orderId: `#${order._id.toString().slice(-8).toUpperCase()}`,
        total: formatMoney(order.totalPrice, order.currency || settings?.currency?.code),
    trackingNumber: order.trackingNumber || "",
    storeName: settings?.store?.name || "ShopEase",
  };

  // Subject sirf ek line ka text (nayi line ghusa kar headers kharab karna mumkin nahi)
  const subject = fillText(template.subject.replace(/[\r\n]+/g, " "), values, (v) =>
    String(v).replace(/[\r\n]+/g, " ")
  );

  // Body: pehle template ko mehfooz banate hain, phir qeematein (woh bhi mehfooz) lagate hain
  const toHtml = (text) => fillText(escapeHtml(text), values, escapeHtml).replace(/\r?\n/g, "<br>");

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
      <h2 style="color: #0F766E;">${toHtml(template.heading)}</h2>
      <p>${toHtml(template.message)}</p>
      <p><strong>Order ID:</strong> ${escapeHtml(values.orderId)}</p>
      <p><strong>Total:</strong> ${escapeHtml(values.total)}</p>
      ${
        values.trackingNumber
          ? `<p><strong>Tracking Number:</strong> ${escapeHtml(values.trackingNumber)}</p>`
          : ""
      }
      <p style="color: #52606D; font-size: 13px;">Thank you for shopping with ${escapeHtml(values.storeName)}.</p>
    </div>
  `;

  return { subject, html };
};

// Email bhejta hai. Fail ho to bhi asal kaam (order, status) nahi rukta.
const sendTemplatedEmail = async (key, order, user) => {
  try {
    if (!user?.email) return;
    const { subject, html } = await renderEmail(key, order, user);
    sendEmail({ to: user.email, subject, html });
  } catch (error) {
    console.error("Templated email failed:", error.message);
  }
};

module.exports = {
  DEFAULT_TEMPLATES,
  TEMPLATE_LABELS,
  PLACEHOLDERS,
  effectiveTemplates,
  sendTemplatedEmail,
};