
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function SellPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Sell on Nexora</h1>
      <p className="mt-3 max-w-xl text-muted">
        Reach B2C shoppers and B2B buyers from one catalog. GST settlements, pan-India logistics, and AI pricing
        suggestions.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["1", "Register GSTIN & KYC"],
          ["2", "List products"],
          ["3", "Get paid in 7 days"],
        ].map(([n, t]) => (
          <Card key={n} className="p-5">
            <p className="text-sm text-muted">Step {n}</p>
            <p className="mt-1 font-semibold">{t}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/seller/register">
          <Button variant="cta">Start registration</Button>
        </Link>
        <Link href="/seller">
          <Button variant="outline">Seller dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
