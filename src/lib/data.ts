import type { Order, Product, Review, Seller } from "./types";

export const sellers: Seller[] = [
  {
    id: "s1",
    name: "Fresh Basket Farm",
    city: "Shivamogga",
    gstin: "29AABCF9603R1ZX",
    rating: 4.8,
    years: 9,
    fulfilled: "18k+",
    kyc: "verified",
    type: "marketplace",
  },
  {
    id: "s2",
    name: "Sri Lakshmi Grocery",
    city: "Bengaluru",
    gstin: "29AAGCK5521Q1Z4",
    rating: 4.7,
    years: 12,
    fulfilled: "32k+",
    kyc: "verified",
    type: "marketplace",
  },
  {
    id: "s3",
    name: "Annapurna Fresh Mart",
    city: "Mysuru",
    gstin: "29AAACN1234F1Z5",
    rating: 4.9,
    years: 7,
    fulfilled: "24k+",
    kyc: "verified",
    type: "marketplace",
  },
  {
    id: "s4",
    name: "Green Valley Organics",
    city: "Hassan",
    gstin: "29AADCS7788P1Z2",
    rating: 4.6,
    years: 15,
    fulfilled: "11k+",
    kyc: "verified",
    type: "brand",
  },
];

export const categories = [
  { slug: "fruits", name: "Fruits", emoji: "🍎", count: 36 },
  { slug: "vegetables", name: "Vegetables", emoji: "🥦", count: 48 },
  { slug: "dairy", name: "Dairy & Eggs", emoji: "🥛", count: 24 },
  { slug: "staples", name: "Rice, Atta & Grains", emoji: "🌾", count: 42 },
  { slug: "pulses", name: "Pulses", emoji: "🫘", count: 28 },
  { slug: "spices", name: "Masala & Spices", emoji: "🌶️", count: 31 },
  { slug: "snacks", name: "Snacks", emoji: "🍪", count: 35 },
  { slug: "beverages", name: "Beverages", emoji: "🧃", count: 22 },
  { slug: "household", name: "Household", emoji: "🧹", count: 29 },
];

const img = (url: string) => `${url}?auto=format&fit=crop&w=1000&q=80`;

export const products: Product[] = [
  {
    id: "p1", slug: "fresh-banana", name: "Fresh Bananas", brand: "Fresh Basket", category: "fruits", subcategory: "Fresh Fruits",
    image: img("https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e"), images: [img("https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e")],
    mrp: 70, price: 60, gstRate: 0, rating: 4.7, reviewCount: 1280, sold: 8400, sellerId: "s1", stock: 85,
    deliveryEta: "Today by 8 PM", location: "Fresh stock from Shivamogga", tags: ["Fresh today", "Best seller"],
    highlights: ["Naturally ripened", "Fresh daily", "Sold by weight"], description: "Fresh, naturally ripened bananas suitable for everyday eating and breakfast.",
    specs: { Unit: "1 kg", Origin: "Karnataka", Storage: "Room temperature" }, moq: 1, tiers: [{ minQty: 1, price: 60 }, { minQty: 5, price: 55 }, { minQty: 20, price: 50 }], aiReason: "Popular everyday fruit in your area",
  },
  {
    id: "p2", slug: "red-apples", name: "Fresh Red Apples", brand: "Green Valley", category: "fruits", subcategory: "Fresh Fruits",
    image: img("https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6"), images: [img("https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6")],
    mrp: 220, price: 189, gstRate: 0, rating: 4.6, reviewCount: 940, sold: 6200, sellerId: "s4", stock: 42,
    deliveryEta: "Tomorrow by 12 PM", location: "Fresh stock from Hassan", tags: ["Farm fresh"],
    highlights: ["Crisp and juicy", "Carefully sorted", "No artificial polish"], description: "Crisp, juicy red apples selected for freshness and packed carefully.",
    specs: { Unit: "1 kg", Variety: "Red apple", Storage: "Refrigerate" }, moq: 1, tiers: [{ minQty: 1, price: 189 }, { minQty: 5, price: 179 }, { minQty: 20, price: 169 }],
  },
  {
    id: "p3", slug: "tomato", name: "Fresh Tomatoes", brand: "Sri Lakshmi", category: "vegetables", subcategory: "Daily Vegetables",
    image: img("https://images.unsplash.com/photo-1546094096-0df4bcaaa337"), images: [img("https://images.unsplash.com/photo-1546094096-0df4bcaaa337")],
    mrp: 55, price: 42, gstRate: 0, rating: 4.5, reviewCount: 2100, sold: 12400, sellerId: "s2", stock: 110,
    deliveryEta: "Today by 8 PM", location: "Local fresh market · Bengaluru", tags: ["Daily essential", "Fresh today"],
    highlights: ["Firm and ripe", "Sorted daily", "Ideal for cooking"], description: "Fresh tomatoes for curries, rasam, salads and everyday cooking.",
    specs: { Unit: "1 kg", Type: "Ripe tomatoes", Storage: "Cool and dry" }, moq: 1, tiers: [{ minQty: 1, price: 42 }, { minQty: 5, price: 39 }, { minQty: 20, price: 35 }], aiReason: "Frequently bought with onions and potatoes",
  },
  {
    id: "p4", slug: "potatoes", name: "Farm Fresh Potatoes", brand: "Annapurna", category: "vegetables", subcategory: "Daily Vegetables",
    image: img("https://images.unsplash.com/photo-1518977676601-b53f82aba655"), images: [img("https://images.unsplash.com/photo-1518977676601-b53f82aba655")],
    mrp: 48, price: 36, gstRate: 0, rating: 4.6, reviewCount: 1720, sold: 9800, sellerId: "s3", stock: 140,
    deliveryEta: "Today by 8 PM", location: "Fresh stock from Mysuru", tags: ["Best value"],
    highlights: ["Clean and sorted", "Farm fresh", "Great for daily cooking"], description: "Clean, sorted potatoes for curries, fries and everyday meals.",
    specs: { Unit: "1 kg", Type: "Table potato", Storage: "Cool and dry" }, moq: 1, tiers: [{ minQty: 1, price: 36 }, { minQty: 5, price: 33 }, { minQty: 20, price: 30 }],
  },
  {
    id: "p5", slug: "chakki-atta", name: "Organic Chakki Atta", brand: "Annapurna Farms", category: "staples", subcategory: "Flour",
    image: img("https://images.unsplash.com/photo-1509440159596-0249088772ff"), images: [img("https://images.unsplash.com/photo-1509440159596-0249088772ff")],
    mrp: 620, price: 499, gstRate: 5, rating: 4.7, reviewCount: 8800, sold: 91000, sellerId: "s3", stock: 1200,
    deliveryEta: "Tomorrow", location: "Fulfilled from Mysuru", tags: ["Best seller", "10 kg"],
    highlights: ["Stone-ground", "100% whole wheat", "Freshly packed"], description: "Fresh chakki atta made from whole wheat, ideal for soft everyday rotis.",
    specs: { Weight: "10 kg", Type: "Whole wheat", Shelf: "60 days" }, moq: 1, tiers: [{ minQty: 1, price: 499 }, { minQty: 10, price: 459 }, { minQty: 50, price: 429 }], aiReason: "A regular household staple",
  },
  {
    id: "p6", slug: "toor-dal", name: "Premium Toor Dal", brand: "Sri Lakshmi", category: "pulses", subcategory: "Dal",
    image: img("https://images.unsplash.com/photo-1585996838653-5d7a1f1c9f89"), images: [img("https://images.unsplash.com/photo-1585996838653-5d7a1f1c9f89")],
    mrp: 190, price: 165, gstRate: 5, rating: 4.6, reviewCount: 3200, sold: 15300, sellerId: "s2", stock: 560,
    deliveryEta: "Tomorrow", location: "Bengaluru", tags: ["Premium quality"],
    highlights: ["Cleaned and sorted", "Rich in protein", "Freshly packed"], description: "Clean, sorted toor dal for sambar, dal and everyday South Indian cooking.",
    specs: { Weight: "1 kg", Type: "Toor dal", Storage: "Cool and dry" }, moq: 1, tiers: [{ minQty: 1, price: 165 }, { minQty: 10, price: 155 }, { minQty: 50, price: 145 }],
  },
  {
    id: "p7", slug: "full-cream-milk", name: "Full Cream Milk", brand: "Nandini Fresh", category: "dairy", subcategory: "Milk",
    image: img("https://images.unsplash.com/photo-1563636619-e9143da7973b"), images: [img("https://images.unsplash.com/photo-1563636619-e9143da7973b")],
    mrp: 36, price: 34, gstRate: 0, rating: 4.8, reviewCount: 4100, sold: 20100, sellerId: "s1", stock: 300,
    deliveryEta: "Today by 7 PM", location: "Local dairy delivery", tags: ["Fresh daily"],
    highlights: ["Pasteurised", "Full cream", "Daily delivery"], description: "Fresh full-cream milk for tea, coffee, breakfast and cooking.",
    specs: { Unit: "500 ml", Type: "Full cream", Storage: "Refrigerate" }, moq: 1, tiers: [{ minQty: 1, price: 34 }, { minQty: 6, price: 33 }, { minQty: 30, price: 31 }],
  },
  {
    id: "p8", slug: "farm-eggs", name: "Farm Fresh Eggs", brand: "Fresh Basket", category: "dairy", subcategory: "Eggs",
    image: img("https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f"), images: [img("https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f")],
    mrp: 110, price: 99, gstRate: 0, rating: 4.7, reviewCount: 2800, sold: 14200, sellerId: "s1", stock: 75,
    deliveryEta: "Today by 8 PM", location: "Fresh stock from Shivamogga", tags: ["12 eggs"],
    highlights: ["Farm fresh", "Carefully packed", "12 eggs per tray"], description: "Fresh farm eggs packed carefully for home delivery.",
    specs: { Pack: "12 eggs", Type: "Farm fresh", Storage: "Refrigerate" }, moq: 1, tiers: [{ minQty: 1, price: 99 }, { minQty: 5, price: 94 }, { minQty: 20, price: 89 }],
  },
  {
    id: "p9", slug: "basmati-rice", name: "Everyday Basmati Rice", brand: "Annapurna", category: "staples", subcategory: "Rice",
    image: img("https://images.unsplash.com/photo-1586201375761-83865001e31c"), images: [img("https://images.unsplash.com/photo-1586201375761-83865001e31c")],
    mrp: 720, price: 599, gstRate: 5, rating: 4.5, reviewCount: 2400, sold: 7300, sellerId: "s3", stock: 420,
    deliveryEta: "Tomorrow", location: "Mysuru", tags: ["5 kg"],
    highlights: ["Long grain", "Aromatic", "Good for daily meals"], description: "Aromatic long-grain rice suitable for everyday meals, pulao and biryani.",
    specs: { Weight: "5 kg", Type: "Basmati", Shelf: "12 months" }, moq: 1, tiers: [{ minQty: 1, price: 599 }, { minQty: 10, price: 559 }, { minQty: 50, price: 529 }],
  },
  {
    id: "p10", slug: "tea-powder", name: "Strong Assam Tea", brand: "Green Valley", category: "beverages", subcategory: "Tea",
    image: img("https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2"), images: [img("https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2")],
    mrp: 240, price: 199, gstRate: 5, rating: 4.6, reviewCount: 1800, sold: 6600, sellerId: "s4", stock: 260,
    deliveryEta: "Tomorrow", location: "Hassan", tags: ["Popular"],
    highlights: ["Strong flavour", "Assam tea leaves", "Freshly packed"], description: "Strong, aromatic Assam tea for a comforting everyday cup.",
    specs: { Weight: "500 g", Type: "Black tea", Origin: "Assam" }, moq: 1, tiers: [{ minQty: 1, price: 199 }, { minQty: 10, price: 189 }, { minQty: 50, price: 179 }],
  },
  {
    id: "p11", slug: "turmeric-powder", name: "Pure Turmeric Powder", brand: "Green Valley", category: "spices", subcategory: "Masala",
    image: img("https://images.unsplash.com/photo-1615485737651-9a4a8d0c2f1f"), images: [img("https://images.unsplash.com/photo-1615485737651-9a4a8d0c2f1f")],
    mrp: 130, price: 109, gstRate: 5, rating: 4.7, reviewCount: 1300, sold: 5100, sellerId: "s4", stock: 310,
    deliveryEta: "Tomorrow", location: "Hassan", tags: ["Kitchen essential"],
    highlights: ["Pure turmeric", "Bright colour", "Freshly packed"], description: "Pure turmeric powder for everyday Indian cooking.",
    specs: { Weight: "200 g", Type: "Turmeric", Shelf: "9 months" }, moq: 1, tiers: [{ minQty: 1, price: 109 }, { minQty: 10, price: 99 }, { minQty: 50, price: 92 }],
  },
  {
    id: "p12", slug: "biscuits-family-pack", name: "Family Biscuit Pack", brand: "Sri Lakshmi", category: "snacks", subcategory: "Biscuits",
    image: img("https://images.unsplash.com/photo-1558961363-fa8fdf82db35"), images: [img("https://images.unsplash.com/photo-1558961363-fa8fdf82db35")],
    mrp: 120, price: 99, gstRate: 18, rating: 4.4, reviewCount: 920, sold: 4400, sellerId: "s2", stock: 190,
    deliveryEta: "Tomorrow", location: "Bengaluru", tags: ["Family pack"],
    highlights: ["Assorted biscuits", "Family size", "Sealed pack"], description: "A convenient assortment of biscuits for tea time and family snacking.",
    specs: { Pack: "6 packs", Type: "Assorted biscuits", Shelf: "6 months" }, moq: 1, tiers: [{ minQty: 1, price: 99 }, { minQty: 10, price: 92 }, { minQty: 50, price: 86 }],
  },
];

export const reviews: Review[] = [
  { id: "r1", productId: "p1", author: "Meera Iyer", city: "Bengaluru", rating: 5, title: "Fresh bananas", body: "Arrived fresh and just right for the week.", date: "8 Sep 2026", verified: true },
  { id: "r2", productId: "p3", author: "Rohit Sharma", city: "Mysuru", rating: 5, title: "Good quality", body: "Tomatoes were firm and fresh. Good value too.", date: "6 Sep 2026", verified: true },
  { id: "r3", productId: "p5", author: "Anjali Desai", city: "Shivamogga", rating: 5, title: "Soft rotis", body: "The atta makes really soft rotis and was packed well.", date: "28 Aug 2026", verified: true },
];

export const orders: Order[] = [
  { id: "NXR-260915-1024", date: "15 Sep 2026", items: [{ productId: "p1", qty: 2, price: 60 }, { productId: "p3", qty: 1, price: 42 }, { productId: "p7", qty: 2, price: 34 }], total: 230, status: "placed", payment: "UPI · GPay", address: "12, Palm Grove Apts, Indiranagar, Bengaluru 560038", eta: "Today by 8 PM" },
  { id: "NXR-260913-4411", date: "13 Sep 2026", items: [{ productId: "p5", qty: 1, price: 499 }, { productId: "p6", qty: 1, price: 165 }], total: 664, status: "delivered", payment: "UPI · PhonePe", address: "12, Palm Grove Apts, Indiranagar, Bengaluru 560038" },
  { id: "NXR-260908-9021", date: "8 Sep 2026", items: [{ productId: "p2", qty: 1, price: 189 }], total: 189, status: "delivered", payment: "Cash on delivery", address: "12, Palm Grove Apts, Indiranagar, Bengaluru 560038" },
];

export const customer = {
  name: "Aditi Rao", email: "aditi.rao@email.com", phone: "+91 98765 43210", gstin: "29AAPFR8890Q1Z3", company: "Rao Retail Pvt Ltd",
  loyalty: { points: 2460, tier: "Gold", next: "Platinum at 5,000 pts" },
  address: { line1: "12, Palm Grove Apts", line2: "100 Feet Rd, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
};


export const users = [
  { id: "USR-1001", status: "active", joined: "Sep 2026" },
  { id: "USR-1002", status: "active", joined: "Sep 2026" },
  { id: "USR-1003", status: "active", joined: "Aug 2026" },
  { id: "USR-1004", status: "suspended", joined: "Aug 2026" },
];
export const invoices = [
  {
    id: "INV-1001",
    business: "Green Leaf Restaurant",
    date: "15 Sep 2026",
    amount: 12500,
    status: "Paid",
  },
  {
    id: "INV-1002",
    business: "City Caterers",
    date: "14 Sep 2026",
    amount: 8200,
    status: "Pending",
  },
];

export const purchaseOrders = [
  {
    id: "PO-1001",
    business: "Green Leaf Restaurant",
    items: 12,
    amount: 12500,
    status: "Confirmed",
  },
  {
    id: "PO-1002",
    business: "City Caterers",
    items: 8,
    amount: 8200,
    status: "Processing",
  },
];

export const rfqs = [
  {
    id: "RFQ-1001",
    business: "Green Leaf Restaurant",
    items: 15,
    requestedDate: "18 Sep 2026",
    status: "Open",
  },
  {
    id: "RFQ-1002",
    business: "Fresh Bite Cafe",
    items: 8,
    requestedDate: "20 Sep 2026",
    status: "Reviewing",
  },
];