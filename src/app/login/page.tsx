
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Field, Input } from "@/components/ui";
import { useStore, type AppUser } from "@/components/providers";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();

    const nextUser: AppUser = {
      id: `customer-${Date.now()}`,
      name: name.trim() || "Nexora Customer",
      email: email.trim() || "customer@demo.nexora",
      phone: "",
      role: "customer",
    };

    login(nextUser);

    const next = params.get("next");
    router.replace(next || "/");
  }

  return (
    <div className="min-h-[75vh] bg-bg px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
            N
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            Welcome to Nexora
          </h1>

          <p className="mt-2 text-muted">
            Log in to shop fresh groceries at everyday low prices.
          </p>
        </div>

        <Card className="p-6 shadow-[var(--shadow)]">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <p className="text-xs text-muted">
              Prototype login: no real password or payment credentials are
              collected.
            </p>

            <Button type="submit" size="lg" className="w-full">
              Continue shopping
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
            <span>🥬 Fresh groceries</span>
            <span>•</span>
            <span>🚚 1-day delivery</span>
            <span>•</span>
            <span>💵 COD</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

