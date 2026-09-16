import { Button, Card, Field, Input, PageHeader } from "@/components/ui";

export default function MarketingPage() {
  return (
    <div>
      <PageHeader title="Marketing" subtitle="Coupons, deals and sponsored placements." />
      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Coupon code">
          <Input defaultValue="FESTIVE12" />
        </Field>
        <Field label="Discount %">
          <Input defaultValue="12" />
        </Field>
        <Field label="Budget (₹)">
          <Input defaultValue="25000" />
        </Field>
        <Field label="Placement">
          <Input defaultValue="Homepage deals rail" />
        </Field>
        <Button className="w-fit">Launch campaign</Button>
      </Card>
    </div>
  );
}
