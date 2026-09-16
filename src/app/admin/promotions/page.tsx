import { Button, Card, PageHeader } from "@/components/ui";

export default function PromosPage() {
  return (
    <div>
      <PageHeader title="Promotions" subtitle="Create simple offers to help local sellers attract customers." />
      <Card className="p-5">
        <p className="font-semibold">Navratri Sale · 15% sitewide cap ₹2,000</p>
        <p className="mt-1 text-sm text-muted">HDFC 10% · UPI cashback ₹100 · 20 Sep–2 Oct</p>
        <Button className="mt-4" size="sm">
          Publish
        </Button>
      </Card>
    </div>
  );
}
