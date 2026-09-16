"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { useStore } from "@/components/providers";
import { Button, Card, Field, Input } from "@/components/ui";

const steps = ["Address", "Delivery", "Payment", "Review"];

export default function CheckoutPage() {
  const { user } = useStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const orderId = "NXR-260915-1024";

  return (
    <AuthGuard role="customer">
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-muted">Just a few simple steps to place your grocery order.</p>

      <ol className="mt-5 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <li key={s} className={`rounded-xl px-2 py-3 text-center text-xs font-semibold sm:text-sm ${i <= step ? "bg-brand text-white" : "bg-surface-2 text-muted"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <Card className="mt-6 p-6">
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input defaultValue={user?.name} /></Field>
            <Field label="Mobile number"><Input defaultValue={user?.phone} /></Field>
            <div className="sm:col-span-2"><Field label="Address"><Input placeholder="House / street / landmark" /></Field></div>
            <Field label="Area"><Input placeholder="Area / locality" /></Field>
            <Field label="City"><Input placeholder="City" /></Field>
            <Field label="PIN code"><Input placeholder="6-digit PIN" /></Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">When should we deliver?</h2>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-brand bg-brand-soft p-4 text-base">
              <input type="radio" name="ship" defaultChecked />
              <span><strong>Today</strong><br /><span className="text-sm text-muted">Free · By 8 PM</span></span>
            </label>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-line p-4 text-base">
              <input type="radio" name="ship" />
              <span><strong>Tomorrow</strong><br /><span className="text-sm text-muted">Free · By 12 PM</span></span>
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Choose payment method</h2>
            {[
              "UPI (GPay / PhonePe / BHIM)",
              "Cash on delivery",
              "Credit / debit card",
            ].map((method, i) => (
              <label key={method} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-base ${i === 0 ? "border-brand bg-brand-soft" : "border-line"}`}>
                <input type="radio" name="pay" defaultChecked={i === 0} />
                {method}
              </label>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Please check your order</h2>
            <div className="rounded-xl bg-surface-2 p-4 text-sm">
              <p><strong>Deliver to:</strong> Your selected delivery address</p>
              <p className="mt-2"><strong>Payment:</strong> UPI</p>
              <p className="mt-2"><strong>Delivery:</strong> Today by 8 PM</p>
            </div>
            <p className="text-sm text-muted">Your order total will be shown in the cart before you place the order.</p>
          </div>
        ) : null}

        <div className="mt-7 flex justify-between gap-3">
          <Button variant="outline" size="lg" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < 3 ? (
            <Button size="lg" onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button variant="cta" size="lg" onClick={() => setDone(true)}>Place order</Button>
          )}
        </div>
      </Card>

      {done ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
          <div className="w-full max-w-md rounded-3xl bg-surface p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 size={52} strokeWidth={2.2} />
            </div>
            <h2 id="order-success-title" className="mt-5 text-2xl font-bold">Order placed successfully!</h2>
            <p className="mt-2 text-muted">Thank you, {user?.name?.split(" ")[0] || "there"}. Your grocery order has been confirmed.</p>
            <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-left text-sm">
              <div className="flex justify-between"><span>Order number</span><strong>{orderId}</strong></div>
              <div className="mt-2 flex justify-between"><span>Delivery</span><strong>Today by 8 PM</strong></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={`/track/${orderId}`}><Button className="w-full" size="lg">Track order</Button></Link>
              <Link href="/products"><Button variant="outline" className="w-full" size="lg">Continue shopping</Button></Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </AuthGuard>
  );
}
