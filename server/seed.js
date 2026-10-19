require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Category = require("./models/Category");
const Product = require("./models/Product");
const { generateUniqueSlug } = require("./utils/slugify");

const categoriesData = [
  { name: "Men", image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400" },
  { name: "Women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400" },
  { name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400" },
  { name: "Home & Living", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400" },
];

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

const productsData = [
  { name: "Classic Cotton T-Shirt", category: "Men", brand: "Urban", price: 1500, discountPrice: 1200, sku: "TS-001", stock: 25, sizes: ["S", "M", "L"], colors: ["Black", "White"], isFeatured: true },
  { name: "Slim Fit Jeans", category: "Men", brand: "Denimo", price: 3200, discountPrice: 0, sku: "JN-001", stock: 15, sizes: ["30", "32", "34"], colors: ["Blue"], isFeatured: false },
  { name: "Leather Jacket", category: "Men", brand: "Urban", price: 8500, discountPrice: 6800, sku: "JK-001", stock: 4, sizes: ["M", "L", "XL"], colors: ["Black"], isFeatured: true },
  { name: "Formal Shirt", category: "Men", brand: "Classique", price: 2200, discountPrice: 0, sku: "SH-001", stock: 20, sizes: ["S", "M", "L", "XL"], colors: ["White", "Sky Blue"], isFeatured: false },
  { name: "Running Sneakers", category: "Men", brand: "Sprint", price: 5500, discountPrice: 4400, sku: "SN-001", stock: 0, sizes: ["8", "9", "10"], colors: ["Grey"], isFeatured: false, status: "out_of_stock" },

  { name: "Floral Summer Dress", category: "Women", brand: "Bloom", price: 3800, discountPrice: 3040, sku: "DR-001", stock: 12, sizes: ["S", "M", "L"], colors: ["Pink", "Yellow"], isFeatured: true },
  { name: "Handbag - Tote", category: "Women", brand: "Luxe", price: 4200, discountPrice: 0, sku: "BG-001", stock: 8, sizes: [], colors: ["Tan", "Black"], isFeatured: false },
  { name: "Skinny Fit Trousers", category: "Women", brand: "Bloom", price: 2600, discountPrice: 2080, sku: "TR-001", stock: 18, sizes: ["S", "M", "L"], colors: ["Black", "Beige"], isFeatured: false },
  { name: "Silk Scarf", category: "Women", brand: "Luxe", price: 1200, discountPrice: 0, sku: "SC-001", stock: 25, sizes: [], colors: ["Red", "Blue"], isFeatured: false },
  { name: "Heeled Sandals", category: "Women", brand: "StepUp", price: 3100, discountPrice: 0, sku: "SD-001", stock: 3, sizes: ["6", "7", "8"], colors: ["Nude"], isFeatured: false },

  { name: "Wireless Earbuds", category: "Electronics", brand: "SoundPro", price: 6500, discountPrice: 5200, sku: "EB-001", stock: 30, sizes: [], colors: ["Black", "White"], isFeatured: true },
  { name: "Smart Watch", category: "Electronics", brand: "SoundPro", price: 12000, discountPrice: 9600, sku: "SW-001", stock: 10, sizes: [], colors: ["Black"], isFeatured: true },
  { name: "Bluetooth Speaker", category: "Electronics", brand: "BoomBox", price: 4500, discountPrice: 0, sku: "SP-001", stock: 0, sizes: [], colors: ["Red"], isFeatured: false, status: "out_of_stock" },

  { name: "Ceramic Table Lamp", category: "Home & Living", brand: "Cozy", price: 2800, discountPrice: 0, sku: "LP-001", stock: 14, sizes: [], colors: ["White"], isFeatured: false },
  { name: "Cotton Bedsheet Set", category: "Home & Living", brand: "Cozy", price: 3500, discountPrice: 2800, sku: "BS-001", stock: 20, sizes: ["Queen", "King"], colors: ["Grey", "Navy"], isFeatured: true },
];

const seed = async () => {
  await connectDB();

  console.log("Clearing old products and categories...");
  await Product.deleteMany({});
  await Category.deleteMany({});

  console.log("Creating categories...");
  const categoryMap = {};
  for (const cat of categoriesData) {
    const slug = await generateUniqueSlug(Category, cat.name);
    const created = await Category.create({ ...cat, slug });
    categoryMap[cat.name] = created._id;
  }

  console.log("Creating products...");
  let count = 0;
  for (const p of productsData) {
    const slug = await generateUniqueSlug(Product, p.name);
    await Product.create({
      ...p,
      slug,
      description: `${p.name} - premium quality from ${p.brand}. Great for everyday use.`,
      category: categoryMap[p.category],
      images: [img(p.sku)],
      status: p.status || "active",
      rating: p.isFeatured ? 4.5 : 0,
      numReviews: p.isFeatured ? Math.floor(Math.random() * 40) + 5 : 0,
    });
    count++;
  }

  console.log(`Done. ${categoriesData.length} categories and ${count} products created.`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});