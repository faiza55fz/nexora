import { Card, PageHeader } from "@/components/ui";

export default function AdminReturns() {
  return (
    <div>
      <PageHeader title="Returns & refunds" />
      <Card className="p-5 text-sm">
        <p className="font-semibold">NXR-240828-9021</p>
        <p className="mt-1 text-muted">
          Vitamin C serum · QC pending at Bengaluru reverse hub · refund ₹649 to HDFC card after approve.
        </p>
      </Card>
    </div>
  );
}
