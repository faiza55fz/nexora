"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { products } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Input, Select } from "@/components/ui";
import { cn } from "@/lib/format";

export default function ListingClient() {
  const params = useSearchParams();
  const q0 = params.get("q") ?? "";
  const cat0 = params.get("category") ?? "all";
  const [q, setQ] = useState(q0);
  const [cat, setCat] = useState(cat0);
  const [sort, setSort] = useState("relevance");
  const [max, setMax] = useState(100000);

  const list = useMemo(() => {
    let rows = products.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      const okQ = !q || hay.includes(q.toLowerCase());
      const okC = cat === "all" || p.category === cat;
      const okP = p.price <= max;
      return okQ && okC && okP;
    });
    if (sort === "price-asc") rows = [...rows].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") rows = [...rows].sort((a, b) => b.price - a.price);
    if (sort === "rating") rows = [...rows].sort((a, b) => b.rating - a.rating);
    return rows;
  }, [q, cat, sort, max]);

  const cats = ["all", ...new Set(products.map((p) => p.category))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="mt-1 text-sm text-muted">
        Filters, sorting and AI-ranked relevance. {list.length} results
        {q ? ` for “${q}”` : ""}.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in results" />
          <div>
            <p className="mb-2 text-sm font-medium">Category</p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs capitalize",
                    cat === c ? "border-brand bg-brand-soft text-brand" : "border-line",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm">
            Max price ₹{max.toLocaleString("en-IN")}
            <input
              type="range"
              min={200}
              max={100000}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </aside>
        <div>
          <div className="mb-4 flex justify-end">
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-48">
              <option value="relevance">AI relevance</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Rating</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
