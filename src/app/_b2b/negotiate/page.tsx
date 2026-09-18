"use client";

import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function NegotiatePage() {
  const [offer, setOffer] = useState(2499);
  return (
    <div>
      <PageHeader title="Buyer–seller negotiation" subtitle="RFQ-1174 · SafeHands nitrile gloves" />
      <Card className="p-5">
        <div className="space-y-3 text-sm">
          <p className="rounded-xl bg-surface-2 p-3">Seller: Quote {inr(2899)} / carton, MOQ 2, Net 15.</p>
          <p className="rounded-xl bg-brand-soft p-3">You: Counter {inr(2499)}, 10 cartons, Net 30.</p>
          <p className="rounded-xl bg-surface-2 p-3">Seller: Can do {inr(2599)} at 10 cartons, Net 21.</p>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="number"
            value={offer}
            onChange={(e) => setOffer(Number(e.target.value))}
            className="h-11 w-32 rounded-xl border border-line px-3"
          />
          <Button>Send counter</Button>
          <Button variant="outline">Accept 2,599</Button>
        </div>
      </Card>
    </div>
  );
}
