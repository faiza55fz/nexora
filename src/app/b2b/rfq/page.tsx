"use client";

import { useState } from "react";
import { rfqs } from "@/lib/data";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";

export default function RfqPage() {
  const [sent, setSent] = useState(false);
  return (
    <div>
      <PageHeader title="Request for quotation" subtitle="Invite verified sellers. Quotes typically in 24 hours." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <Field label="Title">
            <Input defaultValue="Q3 pantry and stationery" />
          </Field>
          <div className="mt-3">
            <Field label="Need by">
              <Input type="date" defaultValue="2026-09-22" />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Line items">
              <Textarea defaultValue={"A4 paper 70 GSM — 40 reams\nOrganic atta 10kg — 24 bags"} />
            </Field>
          </div>
          <Button className="mt-4" onClick={() => setSent(true)}>
            Send RFQ
          </Button>
          {sent ? <p className="mt-2 text-sm text-success">RFQ-1189 sent to 4 sellers.</p> : null}
        </Card>
        <Card className="p-5">
          <p className="font-semibold">Open RFQs</p>
          <ul className="mt-3 space-y-3 text-sm">
            {rfqs.map((r) => (
              <li key={r.id} className="rounded-xl border border-line p-3">
                <p className="font-medium">
                  {r.id} · {r.title}
                </p>
                <p className="text-muted">
                  {r.status} · {r.items} products · target {r.target}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
