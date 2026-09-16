"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Field, Input } from "@/components/ui";
import { useStore, type AppUser } from "@/components/providers";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useStore();
  const [role, setRole] = useState<"customer" | "vendor" | "admin">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const nextUser: AppUser = {
      id: `${role}-${Date.now()}`,
      name: name.trim() || (role === "admin" ? "Nexora Admin" : role === "vendor" ? "New Vendor" : "Nexora Customer"),
      email: email.trim() || `${role}@demo.nexora`,
      phone: "",
      role,
      vendorStatus: role === "vendor" ? "not-registered" : undefined,
    };
    login(nextUser);
    const next = params.get("next");
    if (role === "vendor") router.replace("/seller/register");
    else if (role === "admin") router.replace("/admin");
    else router.replace(next || "/");
  }

  return (
    <div className="min-h-[75vh] bg-bg px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">N</div>
          <h1 className="mt-4 text-3xl font-bold">Welcome to Nexora</h1>
          <p className="mt-2 text-muted">Log in first to shop, sell or manage the marketplace.</p>
        </div>
        <Card className="p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-3 gap-2">
            {(["customer", "vendor", "admin"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize ${role === r ? "border-brand bg-brand-soft text-brand" : "border-line"}`}>
                {r}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>
            <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
            <p className="text-xs text-muted">Prototype login: no real password or payment credentials are collected.</p>
            <Button type="submit" size="lg" className="w-full">Continue as {role}</Button>
          </form>
          {role === "vendor" && <p className="mt-4 rounded-xl bg-warning-soft p-3 text-sm text-warning">New vendors must complete registration before their seller profile is activated.</p>}
        </Card>
      </div>
    </div>
  );
}
