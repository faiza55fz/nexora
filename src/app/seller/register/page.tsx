"use client";

import { useState } from "react";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";

export default function SellerRegister() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { user, login } = useStore();
  if (!user) {
    return <div className="mx-auto max-w-xl px-4 py-12"><Card className="p-8 text-center"><h1 className="text-2xl font-bold">Login first</h1><p className="mt-2 text-muted">Create or log in to your Nexora account before registering as a vendor.</p><Button className="mt-6" size="lg" onClick={() => router.push("/login?next=/seller/register")}>Go to login</Button></Card></div>;
  }

  if (submitted) {
    return <div className="mx-auto max-w-xl px-4 py-12"><Card className="p-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-2xl">✓</div><h1 className="mt-4 text-2xl font-bold">Registration submitted</h1><p className="mt-2 text-muted">Your vendor profile is created and is waiting for admin approval. You can view your profile and registration status from the seller area.</p><Button className="mt-6" size="lg" onClick={() => router.push("/seller")}>Open seller profile</Button></Card></div>;
  }

  return (
    <div>
      <PageHeader title="Seller registration & KYC" subtitle="GSTIN, PAN, bank/UPI and pickup address." />
      <Card className="p-6">
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal name">
              <Input defaultValue="Fresh Basket Farm" />
            </Field>
            <Field label="GSTIN">
              <Input defaultValue="29AABCU9603R1ZX" />
            </Field>
            <Field label="PAN">
              <Input defaultValue="AABCU9603R" />
            </Field>
            <Field label="Pickup city">
              <Input defaultValue="Bengaluru" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account / UPI">
              <Input defaultValue="aarav@okhdfcbank" />
            </Field>
            <Field label="Document">
              <Select>
                <option>GST certificate</option>
                <option>Cancelled cheque</option>
              </Select>
            </Field>
            <p className="sm:col-span-2 text-sm text-success">eKYC match: GSTIN + PAN verified with GSTN sandbox.</p>
          </div>
        )}
        <Button className="mt-6" onClick={() => { if (step === 0) setStep(1); else { login({ ...user, role: "vendor", businessName: "Fresh Basket Farm", city: "Bengaluru", vendorStatus: "pending" }); setSubmitted(true); } }}>
          {step === 0 ? "Continue" : "Submit for approval"}
        </Button>
      </Card>
    </div>
  );
}
