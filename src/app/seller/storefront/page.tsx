import { products, sellers } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Badge, PageHeader } from "@/components/ui";

export default function StorefrontPage() {
  const seller = sellers[0];
  return (
    <div>
      <PageHeader title="Seller storefront" subtitle={`${seller.name} · ${seller.city}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone="success">KYC {seller.kyc}</Badge>
        <Badge>{seller.rating}★</Badge>
        <Badge tone="muted">{seller.fulfilled} orders</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 6).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
