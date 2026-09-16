export type Mode = "b2c" | "b2b";

export type PriceTier = {
  minQty: number;
  price: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  image: string;
  images: string[];
  mrp: number;
  price: number;
  gstRate: number;
  rating: number;
  reviewCount: number;
  sold: number;
  sellerId: string;
  stock: number;
  deliveryEta: string;
  location: string;
  tags: string[];
  highlights: string[];
  description: string;
  specs: Record<string, string>;
  moq: number;
  tiers: PriceTier[];
  b2bOnly?: boolean;
  aiReason?: string;
};

export type Seller = {
  id: string;
  name: string;
  city: string;
  gstin: string;
  rating: number;
  years: number;
  fulfilled: string;
  kyc: "verified" | "pending" | "rejected";
  type: "brand" | "marketplace";
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "return-requested";

export type Order = {
  id: string;
  date: string;
  items: { productId: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  payment: string;
  address: string;
  eta?: string;
};
