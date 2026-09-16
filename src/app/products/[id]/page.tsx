"use client";

import { use, useState } from "react";
import Link from "next/link";
import { getProduct, getSeller, reviews } from "@/lib/data";
import { useStore } from "@/components/providers";
import { Badge, Button, Card } from "@/components/ui";
import { Stars } from "@/components/product-card";
import { discountPct, gstSplit, inr, wholesalePrice } from "@/lib/format";
import { Heart, GitCompare, MapPin, Shield, Truck } from "lucide-react";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProduct(id);
  const { mode, addToCart, toggleWishlist, toggleCompare, wishlist, compare } = useStore();
  const [qty, setQty] = useState(product?.moq ?? 1);
  const [img, setImg] = useState(0);
  if (!product) return <div className="p-8">Product not found.</div>;
  const seller = getSeller(product.sellerId);
  const unit = mode === "b2b" ? wholesalePrice(product.tiers, qty) : product.price;
  const off = discountPct(product.mrp, unit);
  const { exclusive, gst } = gstSplit(unit, product.gstRate);
  const productReviews = reviews.filter((r) => r.productId === product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images[img] ?? product.image} alt="" className="aspect-square w-full object-cover" />
          </div>
          <div className="mt-3 flex gap-2">
            {product.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setImg(i)}
                className={`h-16 w-16 overflow-hidden rounded-xl border ${i === img ? "border-brand" : "border-line"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">
            {product.brand} · {product.subcategory}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <Stars value={product.rating} />
            <span>
              {product.rating} · {product.reviewCount.toLocaleString("en-IN")} reviews
            </span>
            {off > 0 ? <Badge tone="cta">{off}% off</Badge> : null}
          </div>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-semibold">{inr(unit)}</p>
            <p className="text-muted line-through">{inr(product.mrp)}</p>
          </div>
          <p className="mt-1 text-sm text-muted">
            {mode === "b2b"
              ? `GST extra ${product.gstRate}% · taxable ${inr(exclusive)} + GST ${inr(gst)}`
              : `Inclusive of GST (${product.gstRate}%)`}
          </p>
          {mode === "b2b" ? (
            <Card className="mt-4 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left">
                  <tr>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Unit price</th>
                  </tr>
                </thead>
                <tbody>
                  {product.tiers.map((t) => (
                    <tr key={t.minQty} className="border-t border-line">
                      <td className="px-4 py-2">{t.minQty}+</td>
                      <td className="px-4 py-2">{inr(t.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : null}
          <ul className="mt-5 space-y-2 text-sm">
            {product.highlights.map((h) => (
              <li key={h}>• {h}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="text-sm">
              Qty
              <input
                type="number"
                min={product.moq}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="ml-2 h-11 w-20 rounded-xl border border-line bg-surface px-2"
              />
            </label>
            <Button variant="cta" onClick={() => addToCart(product.id, qty)}>
              Add to cart
            </Button>
            <Button variant="outline" onClick={() => toggleWishlist(product.id)}>
              <Heart size={16} className={wishlist.includes(product.id) ? "fill-cta text-cta" : ""} /> Wishlist
            </Button>
            <Button variant="outline" onClick={() => toggleCompare(product.id)}>
              <GitCompare size={16} /> {compare.includes(product.id) ? "Compared" : "Compare"}
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card className="p-3 text-sm">
              <Truck size={16} className="mb-1" /> {product.deliveryEta}
            </Card>
            <Card className="p-3 text-sm">
              <MapPin size={16} className="mb-1" /> {product.location}
            </Card>
            <Card className="p-3 text-sm">
              <Shield size={16} className="mb-1" /> Seller return policy
            </Card>
          </div>
          {seller ? (
            <Card className="mt-6 p-4">
              <p className="text-sm text-muted">Sold by</p>
              <p className="font-semibold">{seller.name}</p>
              <p className="text-sm text-muted">
                {seller.city} · GSTIN {seller.gstin} · {seller.rating}★ · KYC {seller.kyc}
              </p>
              <Link href="/b2b/rfq" className="mt-2 inline-block text-sm font-semibold text-brand">
                Request quotation
              </Link>
            </Card>
          ) : null}
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Specifications</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">Reviews</h2>
          <div className="mt-4 space-y-4">
            {productReviews.length ? (
              productReviews.map((r) => (
                <div key={r.id}>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted">
                    {r.author}, {r.city} · {r.date}
                    {r.verified ? " · Verified" : ""}
                  </p>
                  <p className="mt-1 text-sm">{r.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No reviews yet for this listing.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
