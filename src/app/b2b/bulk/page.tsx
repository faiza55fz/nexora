"use client";

import { useMemo, useState } from "react";
import { products } from "@/lib/data";
import { useStore } from "@/components/providers";
import { Button, Card, PageHeader } from "@/components/ui";
import { inr, wholesalePrice } from "@/lib/format";

export default function BulkPage() {
  const { addToCart } = useStore();
  const [qty, setQty] = useState<Record<string, number>>({ p6: 20, p5: 10, p7: 2 });
  const rows = useMemo(
    () =>
      products
        .filter((p) => p.category === "office" || p.category === "grocery" || p.category === "industrial")
        .map((p) => {
          const q = qty[p.id] ?? p.moq;
          const unit = wholesalePrice(p.tiers, q);
          return { p, q, unit, total: unit * q, ok: q >= p.moq };
        }),
    [qty],
  );

  return (
    <div>
      <PageHeader title="Bulk ordering" subtitle="Wholesale slabs, MOQ and GST-exclusive unit prices." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th>MOQ</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, q, unit, total, ok }) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3 font-medium">{p.name}</td>
                <td>{p.moq}</td>
                <td>
                  <input
                    type="number"
                    min={p.moq}
                    value={q}
                    onChange={(e) => setQty((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                    className="h-9 w-20 rounded-lg border border-line px-2"
                  />
                </td>
                <td>{inr(unit)}</td>
                <td>{inr(total)}</td>
                <td>
                  <Button size="sm" disabled={!ok} onClick={() => addToCart(p.id, q)}>
                    Add
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
