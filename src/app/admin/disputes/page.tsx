import { AiHint, Card, PageHeader } from "@/components/ui";

export default function DisputesPage() {
  return (
    <div>
      <PageHeader title="Disputes" />
      <AiHint>Likely packaging damage (photo match 0.86) — suggest partial refund ₹400 rather than full return.</AiHint>
      <Card className="mt-4 p-5 text-sm">
        DSP-204 · Buyer vs Fresh Basket Farm · vegetables not fresh · SLA 18 hours remaining.
      </Card>
    </div>
  );
}
