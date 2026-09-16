export function inr(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  }
  if (compact && Math.abs(value) >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(1)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function inrExact(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function discountPct(mrp: number, price: number) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function gstSplit(price: number, gstRate: number) {
  const exclusive = Math.round(price / (1 + gstRate / 100));
  return { exclusive, gst: price - exclusive };
}

export function wholesalePrice(tiers: { minQty: number; price: number }[], qty: number) {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  let price = sorted[0]?.price ?? 0;
  for (const tier of sorted) {
    if (qty >= tier.minQty) price = tier.price;
  }
  return price;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
