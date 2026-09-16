"use client";

import Link from "next/link";
import { products } from "@/lib/data";
import { useStore } from "@/components/providers";
import { AiHint, Button, Card } from "@/components/ui";
import { inr } from "@/lib/format";

export default function ComparePage() {
  const { compare, toggleCompare } = useStore();
  const items = products.filter((p) => compare.includes(p.id));
  const keys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specs))));
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Compare</h1>
      <div className="mt-4">
        <AiHint>
          Compare sellers by price, stock, freshness and delivery time. Choose the seller that best fits your needs.
          mobility vs keyboard work.
        </AiHint>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-muted">
          Add products from listing. <Link href="/products">Browse</Link>
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left"> </th>
                {items.map((p) => (
                  <th key={p.id} className="p-3 text-left">
                    <Card className="p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" className="h-28 w-full rounded-lg object-cover" />
                      <p className="mt-2 font-semibold">{p.name}</p>
                      <p>{inr(p.price)}</p>
                      <Button size="sm" variant="ghost" onClick={() => toggleCompare(p.id)}>
                        Remove
                      </Button>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Price", "Rating", "GST", ...keys].map((k) => (
                <tr key={k} className="border-t border-line">
                  <td className="p-3 font-medium">{k}</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3">
                      {k === "Price"
                        ? inr(p.price)
                        : k === "Rating"
                          ? p.rating
                          : k === "GST"
                            ? `${p.gstRate}%`
                            : p.specs[k] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
