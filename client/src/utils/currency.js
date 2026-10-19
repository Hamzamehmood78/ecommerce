// Backend ke utils/currency.js se milti julti list (dono jagah ek jaisi honi chahiye)
export const CURRENCIES = {
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

export const DEFAULT_CURRENCY = "PKR";
const STORAGE_KEY = "storeCurrency";

// Pichli baar ki currency browser mein yaad rehti hai, taake page khulte hi sahi dikhe
const readStored = () => {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    return CURRENCIES[code] ? code : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

let current = readStored();

export const getCurrencyCode = () => current;

export const setCurrency = (code) => {
  if (!CURRENCIES[code]) return;
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // storage band ho to bhi chalta rahe
  }
};

const infoFor = (code) => CURRENCIES[code] || CURRENCIES[current];

export const currencySymbol = (code = current) => infoFor(code).symbol;

// Raqam ko currency ki decimals tak round (PKR: poore rupay, USD: cents)
export const roundMoney = (amount, code = current) => {
  const factor = 10 ** infoFor(code).decimals;
  return Math.round((Number(amount) + Number.EPSILON) * factor) / factor;
};

// "Rs 1,200" ya "$1,200.00": poori app mein qeemat dikhane ka ek hi tareeqa
export const formatMoney = (amount, code = current) => {
  const { symbol, decimals } = infoFor(code);
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const text = Math.abs(safe).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const gap = /[A-Za-z]$/.test(symbol) ? " " : "";
  return `${safe < 0 ? "-" : ""}${symbol}${gap}${text}`;
};