// src/data/products.js
// Mock product catalog for TechNest Gadget Shop

const products = [
  // ── Smartphones ──────────────────────────────────────────────
  {
    id: "SM001",
    category: "smartphones",
    name: "Samsung Galaxy S24 Ultra",
    price: 189999,
    currency: "LKR",
    stock: 12,
    description: "6.8\" QHD+ Dynamic AMOLED, 200MP camera, S Pen included, 5000mAh battery",
    warranty: "1 year official warranty",
    tags: ["samsung", "galaxy", "s24", "android", "flagship"],
  },
  {
    id: "SM002",
    category: "smartphones",
    name: "iPhone 15 Pro Max",
    price: 229999,
    currency: "LKR",
    stock: 8,
    description: "6.7\" Super Retina XDR, A17 Pro chip, 48MP ProRAW camera, titanium design",
    warranty: "1 year Apple warranty",
    tags: ["apple", "iphone", "15", "pro", "ios"],
  },
  {
    id: "SM003",
    category: "smartphones",
    name: "Xiaomi 14 Pro",
    price: 129999,
    currency: "LKR",
    stock: 15,
    description: "6.73\" LTPO AMOLED, Snapdragon 8 Gen 3, Leica camera system, 120W fast charging",
    warranty: "1 year warranty",
    tags: ["xiaomi", "android", "leica", "snapdragon"],
  },

  // ── Laptops ──────────────────────────────────────────────────
  {
    id: "LP001",
    category: "laptops",
    name: "MacBook Air M3",
    price: 299999,
    currency: "LKR",
    stock: 5,
    description: "13.6\" Liquid Retina, Apple M3 chip, 8GB RAM, 256GB SSD, 18hr battery",
    warranty: "1 year Apple warranty",
    tags: ["apple", "macbook", "m3", "laptop", "mac"],
  },
  {
    id: "LP002",
    category: "laptops",
    name: "Dell XPS 15",
    price: 259999,
    currency: "LKR",
    stock: 7,
    description: "15.6\" OLED touch, Intel Core i7-13700H, 16GB RAM, 512GB SSD, RTX 4060",
    warranty: "1 year Dell warranty",
    tags: ["dell", "xps", "laptop", "windows", "gaming"],
  },
  {
    id: "LP003",
    category: "laptops",
    name: "ASUS ROG Zephyrus G14",
    price: 239999,
    currency: "LKR",
    stock: 4,
    description: "14\" QHD 165Hz, AMD Ryzen 9 7940HS, 16GB RAM, 1TB SSD, RTX 4060",
    warranty: "2 year ASUS warranty",
    tags: ["asus", "rog", "gaming", "laptop", "amd", "ryzen"],
  },

  // ── Tablets ──────────────────────────────────────────────────
  {
    id: "TB001",
    category: "tablets",
    name: "iPad Pro 12.9\" M2",
    price: 199999,
    currency: "LKR",
    stock: 6,
    description: "12.9\" Liquid Retina XDR, M2 chip, 8GB RAM, 256GB, Face ID, Wi-Fi 6E",
    warranty: "1 year Apple warranty",
    tags: ["apple", "ipad", "tablet", "m2", "pro"],
  },
  {
    id: "TB002",
    category: "tablets",
    name: "Samsung Galaxy Tab S9+",
    price: 149999,
    currency: "LKR",
    stock: 9,
    description: "12.4\" Dynamic AMOLED, Snapdragon 8 Gen 2, 12GB RAM, 256GB, S Pen included",
    warranty: "1 year Samsung warranty",
    tags: ["samsung", "galaxy", "tab", "tablet", "android"],
  },

  // ── Audio ─────────────────────────────────────────────────────
  {
    id: "AU001",
    category: "audio",
    name: "Sony WH-1000XM5",
    price: 49999,
    currency: "LKR",
    stock: 20,
    description: "Industry-leading ANC, 30hr battery, LDAC Hi-Res audio, multipoint Bluetooth",
    warranty: "1 year Sony warranty",
    tags: ["sony", "headphones", "anc", "wireless", "bluetooth"],
  },
  {
    id: "AU002",
    category: "audio",
    name: "AirPods Pro 2nd Gen",
    price: 44999,
    currency: "LKR",
    stock: 18,
    description: "H2 chip, Adaptive Transparency, USB-C case, 30hr total battery, MagSafe",
    warranty: "1 year Apple warranty",
    tags: ["apple", "airpods", "pro", "earbuds", "anc", "wireless"],
  },
  {
    id: "AU003",
    category: "audio",
    name: "JBL Flip 6",
    price: 14999,
    currency: "LKR",
    stock: 30,
    description: "Portable Bluetooth speaker, IP67 waterproof, 12hr battery, PartyBoost enabled",
    warranty: "1 year JBL warranty",
    tags: ["jbl", "speaker", "bluetooth", "portable", "waterproof"],
  },

  // ── Accessories ───────────────────────────────────────────────
  {
    id: "AC001",
    category: "accessories",
    name: "Anker 65W GaN Charger",
    price: 5999,
    currency: "LKR",
    stock: 50,
    description: "65W 3-port USB-C PD charger, GaN technology, folds flat, charges laptop+phone+earbuds",
    warranty: "18 month Anker warranty",
    tags: ["anker", "charger", "gan", "usb-c", "fast charging"],
  },
  {
    id: "AC002",
    category: "accessories",
    name: "Apple Watch Series 9",
    price: 89999,
    currency: "LKR",
    stock: 10,
    description: "45mm, Always-On Retina, S9 SiP, Double Tap, crash detection, blood oxygen",
    warranty: "1 year Apple warranty",
    tags: ["apple", "watch", "smartwatch", "wearable", "series 9"],
  },
  {
    id: "AC003",
    category: "accessories",
    name: "Samsung 25W Fast Charger",
    price: 2999,
    currency: "LKR",
    stock: 40,
    description: "25W USB-C super fast charging, compatible with Samsung Galaxy & other USB-C devices",
    warranty: "6 month warranty",
    tags: ["samsung", "charger", "fast charge", "usb-c"],
  },
];

const services = [
  {
    id: "SV001",
    name: "Screen Repair",
    description: "Professional screen replacement for smartphones and tablets",
    priceRange: "LKR 5,000 – 25,000 depending on model",
    turnaround: "Same day or 24 hours",
  },
  {
    id: "SV002",
    name: "Battery Replacement",
    description: "OEM-grade battery replacement with health diagnostics",
    priceRange: "LKR 3,500 – 12,000 depending on model",
    turnaround: "2–4 hours",
  },
  {
    id: "SV003",
    name: "Data Recovery",
    description: "Recover lost data from damaged or corrupted devices",
    priceRange: "LKR 8,000 – 30,000",
    turnaround: "1–3 business days",
  },
  {
    id: "SV004",
    name: "Device Setup & Transfer",
    description: "New device setup, data migration, and app configuration",
    priceRange: "LKR 1,500 – 3,000",
    turnaround: "1–2 hours",
  },
];

/**
 * Search products by keyword
 * @param {string} query
 * @returns {Array}
 */
function searchProducts(query) {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.description.toLowerCase().includes(q)
  );
}

/**
 * Format product catalog as a readable text block for the AI prompt
 */
function getProductCatalogText() {
  const grouped = {};
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  let text = "";
  for (const [cat, items] of Object.entries(grouped)) {
    text += `\n## ${cat.toUpperCase()}\n`;
    for (const item of items) {
      text += `- ${item.name} | LKR ${item.price.toLocaleString()} | Stock: ${item.stock} units\n`;
      text += `  ${item.description}\n`;
      text += `  Warranty: ${item.warranty}\n`;
    }
  }
  return text;
}

function getServicesCatalogText() {
  return services
    .map(
      (s) =>
        `- ${s.name}: ${s.description} | Price: ${s.priceRange} | Turnaround: ${s.turnaround}`
    )
    .join("\n");
}

module.exports = { products, services, searchProducts, getProductCatalogText, getServicesCatalogText };
