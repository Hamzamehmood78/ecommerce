const nodemailer = require("nodemailer");

let transporterPromise = null;
const isProduction = process.env.NODE_ENV === "production";

// Asli SMTP (.env mein) ho to wohi. Warna sirf apne computer par Ethereal ka test account.
// Live (production) par SMTP ke baghair email bheji hi nahi jati (aur terminal mein saaf likha aata hai).
const getTransporter = async () => {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      const port = Number(process.env.SMTP_PORT) || 587;
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }

    if (isProduction) return null;

    const testAccount = await nodemailer.createTestAccount();
    console.log("Using Ethereal test email account:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
      tls: { rejectUnauthorized: false }, // antivirus ki wajah se (sirf local testing)
    });
  })();

  return transporterPromise;
};

// Fire-and-forget: email fail ho to bhi poora app crash na ho
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.error("Email NOT sent: SMTP_HOST, SMTP_USER, SMTP_PASS are not set in production.");
      return;
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ShopEase" <no-reply@shopease.com>',
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email preview (${subject}):`, previewUrl);
    }
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
};

module.exports = sendEmail;