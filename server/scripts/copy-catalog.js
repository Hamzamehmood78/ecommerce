// Local database ka catalog (categories, products, banners, settings, coupons) demo database mein copy.
// Customers, orders, reviews copy NAHI hote.
//
//   server folder se (PowerShell):
//   $env:TARGET_MONGO_URI="mongodb+srv://...ecommerce_demo?..."
//   node scripts/copy-catalog.js          -> sirf dikhata hai (kuch nahi badalta)
//   node scripts/copy-catalog.js --yes    -> asal mein copy (target ki in collections ki purani cheezein mit jati hain)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const SOURCE_URI = process.env.MONGO_URI;
const TARGET_URI = process.env.TARGET_MONGO_URI;
const CONFIRMED = process.argv.includes("--yes");

const COLLECTIONS = ["categories", "products", "banners", "sitesettings", "coupons"];

// Demo mein zaati ya purani maloomat nahi jani chahiye
const cleaners = {
  products: (d) => ({ ...d, notifyList: [], soldCount: 0, rating: 0, numReviews: 0 }),
  coupons: (d) => ({ ...d, usedCount: 0, usedBy: [] }),
};

const dbInfo = (uri) => {
  const url = new URL(uri);
  return `${url.host}${url.pathname}`;
};

const run = async () => {
  if (!SOURCE_URI || !TARGET_URI) {
    console.error("MONGO_URI (server/.env mein) aur TARGET_MONGO_URI (shell mein) dono chahiye.");
    process.exit(1);
  }
  if (dbInfo(SOURCE_URI) === dbInfo(TARGET_URI)) {
    console.error("Source aur target ek hi database hain. Roka gaya.");
    process.exit(1);
  }

  console.log("Source:", dbInfo(SOURCE_URI));
  console.log("Target:", dbInfo(TARGET_URI), "\n");

  const source = await mongoose.createConnection(SOURCE_URI).asPromise();
  const target = await mongoose.createConnection(TARGET_URI).asPromise();

  for (const name of COLLECTIONS) {
    const docs = await source.db.collection(name).find({}).toArray();
    const cleaned = docs.map((d) => (cleaners[name] ? cleaners[name](d) : d));
    console.log(`${name}: ${cleaned.length} documents`);

    if (CONFIRMED) {
      await target.db.collection(name).deleteMany({});
      if (cleaned.length > 0) await target.db.collection(name).insertMany(cleaned);
    }
  }

  console.log(CONFIRMED ? "\nCopy mukammal." : "\nYeh sirf dry run tha. Asal mein copy ke liye --yes ke saath dobara chalayen.");
  await source.close();
  await target.close();
};

run().catch((error) => {
  console.error("Copy nakam:", error.message);
  process.exit(1);
});