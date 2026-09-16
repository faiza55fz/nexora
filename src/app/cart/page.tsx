"use client";

import Link from "next/link";
import { getProduct } from "@/lib/data";
import { useStore } from "@/components/providers";
import { Button, Card } from "@/components/ui";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { cart, setQty, removeFromCart } = useStore();
  const rows = cart
    .map((i) => ({ ...i, product: getProduct(i.productId)! }))
    .filter((r) => r.product);
  const sub = rows.reduce((n, r) => n + r.product.price * r.qty, 0);
  const sellerCount = new Set(rows.map((r) => r.product.sellerId)).size;
  // Delivery responsibility/fees for multi-vendor orders are a client decision.
  // Keep the prototype transparent instead of assuming one fulfillment model.
  const ship = sub > 499 ? 0 : 49;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {rows.length === 0 ? (
            <Card className="p-8 text-center text-muted">Your cart is empty.</Card>
          ) : (
            rows.map((r) => (
              <Card key={r.productId} className="flex gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.product.image} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <Link href={`/products/${r.product.id}`} className="font-semibold">
                    {r.product.name}
                  </Link>
                  <p className="text-sm text-muted">{inr(r.product.price)} / {r.product.specs.Unit ?? r.product.specs.Weight ?? "pack"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={r.qty}
                      onChange={(e) => setQty(r.productId, Number(e.target.value))}
                      className="h-10 w-16 rounded-lg border border-line px-2"
                    />
                    <button className="text-sm text-danger" onClick={() => removeFromCart(r.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
                <p className="font-semibold">{inr(r.product.price * r.qty)}</p>
              </Card>
            ))
          )}
        </div>
        <Card className="h-fit p-5">
          <p className="font-semibold">Summary</p>
          <div className="mt-3 rounded-xl bg-brand-soft p-3 text-sm text-brand">
            {sellerCount === 1 ? "Items from 1 seller" : `Items from ${sellerCount} sellers`} · delivery details shown at checkout
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{inr(sub)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{ship ? inr(ship) : "Free"}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>To pay</span>
              <span>{inr(sub + ship)}</span>
            </div>
          </div>
          <Link href="/checkout">
            <Button variant="cta" className="mt-4 w-full">
              Checkout
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
