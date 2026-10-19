// Store ki mumkina currencies. Sab Stripe mein 2-decimal wali hain (amount x 100).
const CURRENCIES = {
  PKR: { symbol: "Rs", name: "Pakistani Rupee", decimals: 0 },
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { symbol: "€", name: "Euro", decimals: 2 },
  GBP: { symbol: "£", name: "British Pound", decimals: 2 },
  INR: { symbol: "₹", name: "Indian Rupee", decimals: 0 },
  AED: { symbol: "AED", name: "UAE Dirham", decimals: 2 },
  SAR: { symbol: "SAR", name: "Saudi Riyal", decimals: 2 },
  CAD: { symbol: "CA$", name: "Canadian Dollar", decimals: 2 },
  AUD: { symbol: "A$", name: "Australian Dollar", decimals: 2 },
};

const DEFAULT_CURRENCY = "PKR";

const getCurrency = (code) => CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];

// Raqam ko currency ki decimals tak round karta hai (PKR: poore rupay, USD: cents)
const roundMoney = (amount, code) => {
  const { decimals } = getCurrency(code);
  const factor = 10 ** decimals;
  return Math.round((Number(amount) + Number.EPSILON) * factor) / factor;
};

// "Rs 1,200" ya "$1,200.00"
const formatMoney = (amount, code) => {
  const { symbol, decimals } = getCurrency(code);
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const text = Math.abs(safe).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const gap = /[A-Za-z]$/.test(symbol) ? " " : "";
  return `${safe < 0 ? "-" : ""}${symbol}${gap}${text}`;
};

// Stripe sab se chhoti ikai (cents/paisa) mein raqam leta hai
const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

module.exports = { CURRENCIES, DEFAULT_CURRENCY, getCurrency, roundMoney, formatMoney, toMinorUnits };