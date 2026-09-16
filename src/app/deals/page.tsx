import { products } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export default function DealsPage() {
  const deals = products.filter((p) => p.mrp > p.price);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Deals</h1>
      <p className="text-sm text-muted">Fresh grocery deals from local sellers. Offers and prices may vary by seller.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
