"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MapPin,
  Truck,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { useStore } from "@/components/providers";
import { Button, Card, Field, Input } from "@/components/ui";
import { products } from "@/lib/data";

const steps = ["Address", "Delivery", "Payment", "Review"];

export default function CheckoutPage() {
  const { user, cart, clearCart } = useStore();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [houseStreet, setHouseStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");

  const [orderId, setOrderId] = useState("");

  const rows = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) return null;

      return {
        ...item,
        product,
      };
    })
    .filter(
      (
        row,
      ): row is {
        productId: string;
        qty: number;
        product: (typeof products)[number];
      } => row !== null,
    );

  const subtotal = rows.reduce(
    (sum, row) => sum + row.product.price * row.qty,
    0,
  );

  const deliveryFee = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  const total = subtotal + deliveryFee;

  const address = [houseStreet, area, city, pin]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");

  const placeOrder = async () => {
    setError("");

    if (!fullName.trim() || !phone.trim()) {
      setError("Please enter your name and mobile number.");
      setStep(0);
      return;
    }

    if (!houseStreet.trim() || !area.trim() || !city.trim() || !pin.trim()) {
      setError("Please complete your delivery address.");
      setStep(0);
      return;
    }

    if (pin.trim().length !== 6) {
      setError("Please enter a valid 6-digit PIN code.");
      setStep(0);
      return;
    }

    if (!rows.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!user?.email) {
      setError("Your account email is missing. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: fullName.trim(),
          customerEmail: user.email,
          customerPhone: phone.trim(),
          address,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: "cod",
          items: rows.map((row) => ({
            productId: row.product.id,
            productName: row.product.name,
            quantity: row.qty,
            price: row.product.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to place order.");
      }

      setOrderId(data.order.orderNumber);
      clearCart();
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard role="customer">
      <div className="min-h-[75vh] bg-bg px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div>
            <Link
              href="/cart"
              className="text-sm font-medium text-brand hover:underline"
            >
              ← Back to cart
            </Link>

            <h1 className="mt-4 text-3xl font-bold">Checkout</h1>
            <p className="mt-1 text-sm text-muted">
              Complete your order in just a few simple steps.
            </p>
          </div>

          {/* Steps */}
          <ol className="mt-7 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <li
                key={s}
                className={`rounded-xl px-2 py-3 text-center text-xs font-semibold transition sm:text-sm ${
                  i <= step
                    ? "bg-brand text-white"
                    : "bg-surface-2 text-muted"
                }`}
              >
                <span className="hidden sm:inline">
                  {i + 1}. {s}
                </span>
                <span className="sm:hidden">{i + 1}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main checkout card */}
            <Card className="p-5 sm:p-7">
              {/* ADDRESS */}
              {step === 0 ? (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                      <MapPin size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Delivery address
                      </h2>
                      <p className="text-sm text-muted">
                        Where should we deliver your groceries?
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name">
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </Field>

                    <Field label="Mobile number">
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="House / Flat / Street">
                        <Input
                          value={houseStreet}
                          onChange={(e) => setHouseStreet(e.target.value)}
                          placeholder="House number, street name"
                        />
                      </Field>
                    </div>

                    <Field label="Area / Locality">
                      <Input
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Area or locality"
                      />
                    </Field>

                    <Field label="City">
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                      />
                    </Field>

                    <Field label="PIN code">
                      <Input
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="6-digit PIN code"
                        inputMode="numeric"
                        maxLength={6}
                      />
                    </Field>

                    <div className="rounded-xl bg-brand-soft p-3 text-sm text-brand sm:col-span-2">
                      📍 Your delivery location will be used to estimate
                      delivery time and availability.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* DELIVERY */}
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Truck size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Delivery options
                      </h2>
                      <p className="text-sm text-muted">
                        Choose when you'd like your order.
                      </p>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-brand bg-brand-soft p-5">
                    <input
                      type="radio"
                      name="delivery"
                      defaultChecked
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <strong>Tomorrow</strong>
                        <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
                          Recommended
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted">
                        Free delivery • By 8 PM
                      </p>
                    </div>
                  </label>

                  <div className="rounded-2xl border border-line p-5">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-success" />
                      <div>
                        <p className="font-semibold">
                          Freshness guaranteed
                        </p>
                        <p className="text-sm text-muted">
                          Your groceries are packed close to delivery time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* PAYMENT */}
              {step === 2 ? (
                <div className="space-y-4">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Banknote size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Payment method
                      </h2>
                      <p className="text-sm text-muted">
                        Simple and secure payment.
                      </p>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-brand bg-brand-soft p-5">
                    <input
                      type="radio"
                      name="payment"
                      defaultChecked
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong>Cash on delivery</strong>
                        <span className="text-xl">💵</span>
                      </div>

                      <p className="mt-1 text-sm text-muted">
                        Pay when your groceries arrive at your doorstep.
                      </p>
                    </div>
                  </label>

                  <div className="flex gap-3 rounded-xl bg-surface-2 p-4">
                    <ShieldCheck
                      size={20}
                      className="shrink-0 text-success"
                    />

                    <p className="text-sm text-muted">
                      No card or online payment details are required for this
                      order.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* REVIEW */}
              {step === 3 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Review your order
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Please check everything before placing your order.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-surface-2 p-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Deliver to</span>
                      <strong className="text-right">
                        {address || "Delivery address not entered"}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Delivery</span>
                      <strong>Tomorrow by 8 PM</strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Payment</span>
                      <strong>Cash on delivery</strong>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-brand/20 bg-brand-soft p-4">
                    <p className="text-sm font-semibold text-brand">
                      🚚 Your order will be delivered within 1 day.
                    </p>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Navigation */}
              <div className="mt-8 flex justify-between gap-3 border-t border-line pt-5">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={step === 0 || loading}
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>

                {step < 3 ? (
                  <Button
                    size="lg"
                    onClick={() => {
                      setError("");
                      setStep((s) => s + 1);
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="cta"
                    size="lg"
                    disabled={loading}
                    onClick={placeOrder}
                  >
                    {loading ? "Placing order..." : "Place order"}
                  </Button>
                )}
              </div>
            </Card>

            {/* Order summary */}
            <div className="h-fit space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold">Order summary</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">
                      Items ({cart.reduce((sum, item) => sum + item.qty, 0)})
                    </span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted">Delivery</span>
                    <span
                      className={
                        deliveryFee === 0 ? "text-success" : undefined
                      }
                    >
                      {deliveryFee === 0
                        ? "FREE"
                        : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="border-t border-line pt-3">
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <span>🥬</span>
                    <div>
                      <p className="font-medium">Fresh groceries</p>
                      <p className="text-muted">
                        Quality products for your everyday needs.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span>💰</span>
                    <div>
                      <p className="font-medium">Everyday low prices</p>
                      <p className="text-muted">
                        Great value on your daily essentials.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span>🚚</span>
                    <div>
                      <p className="font-medium">1-day delivery</p>
                      <p className="text-muted">
                        Get your order delivered quickly.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Success modal */}
        {done ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-success-title"
          >
            <div className="w-full max-w-md rounded-3xl bg-surface p-7 text-center shadow-2xl">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-soft text-success">
                <CheckCircle2 size={52} strokeWidth={2.2} />
              </div>

              <h2
                id="order-success-title"
                className="mt-5 text-2xl font-bold"
              >
                Order placed successfully!
              </h2>

              <p className="mt-2 text-muted">
                Thank you, {user?.name?.split(" ")[0] || "there"}. Your
                grocery order has been confirmed.
              </p>

              <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span>Order number</span>
                  <strong>{orderId}</strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>Delivery</span>
                  <strong>Tomorrow by 8 PM</strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>Payment</span>
                  <strong>Cash on delivery</strong>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={`/track/${orderId}`}>
                  <Button className="w-full" size="lg">
                    Track order
                  </Button>
                </Link>

                <Link href="/products">
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Continue shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}