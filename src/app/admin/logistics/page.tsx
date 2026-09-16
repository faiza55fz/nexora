import { Card, PageHeader } from "@/components/ui";

export default function LogisticsPage() {
  return (
    <div>
      <PageHeader title="Logistics" subtitle="Delhivery, Blue Dart, Nexora Now" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Bengaluru hub", "On time 96%"],
          ["Bhiwandi hub", "Capacity 82%"],
          ["Hyderabad dark store", "Same-day slot open"],
        ].map(([t, s]) => (
          <Card key={t} className="p-5">
            <p className="font-semibold">{t}</p>
            <p className="text-sm text-muted">{s}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
