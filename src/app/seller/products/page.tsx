import Link from "next/link";
import { Plus } from "lucide-react";
import { products } from "@/lib/data";
import { Button, Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function SellerProducts() {
  return (
    <div>
      <PageHeader title="My products" subtitle="Keep your grocery prices and stock up to date." actions={<Link href="/seller/products/new"><Button size="lg"><Plus size={20} /> Add product</Button></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="overflow-hidden p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="h-40 w-full rounded-xl object-cover" />
            <div className="mt-4">
              <p className="text-lg font-bold">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.specs.Unit ?? p.specs.Weight ?? p.specs.Pack ?? "Per pack"}</p>
              <div className="mt-3 flex items-center justify-between"><strong className="text-lg">{inr(p.price)}</strong><span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.stock < 50 ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{p.stock < 50 ? "Low stock" : `${p.stock} in stock`}</span></div>
              <Button variant="outline" size="lg" className="mt-4 w-full">Update stock / price</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
