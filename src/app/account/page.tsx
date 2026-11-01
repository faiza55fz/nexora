
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";
import { Badge, Button, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";

type KhataTransaction = {
  id: string;
  order_id: string | null;
  entry_type: "credit" | "payment";
  amount: number;
  description: string | null;
  payment_method: string | null;
  created_at: string;
};

type KhataData = {
  balance: number;
  transactions: KhataTransaction[];
};

const links = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/loyalty", label: "Loyalty" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/addresses", label: "Address Book" },
  { href: "/account/settings", label: "Settings" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function AccountPage() {
  const router = useRouter();
  const { user, authReady, logout } = useStore();

  const [khata, setKhata] = useState<KhataData | null>(null);
  const [khataLoading, setKhataLoading] = useState(true);
  const [khataError, setKhataError] = useState("");
  const [showKhataPayment, setShowKhataPayment] = useState(false);
  const [selectedKhataMethod, setSelectedKhataMethod] = useState("upi");
  const [khataPaymentAmount, setKhataPaymentAmount] = useState("");
const [khataPaymentError, setKhataPaymentError] = useState("");
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;

    const loadKhata = async () => {
      setKhataLoading(true);
      setKhataError("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.access_token) {
          throw new Error("Please log in again to view your Khata.");
        }

        const response = await fetch("/api/khata", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load Khata.");
        }

        if (!cancelled) {
          setKhata({
            balance: Number(data.balance) || 0,
            transactions: Array.isArray(data.transactions)
              ? data.transactions
              : [],
          });
        }
      } catch (error) {
        console.error("Khata loading error:", error);

        if (!cancelled) {
          setKhataError(
            error instanceof Error
              ? error.message
              : "Unable to load Khata details."
          );
        }
      } finally {
        if (!cancelled) {
          setKhataLoading(false);
        }
      }
    };

    loadKhata();

    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-brand" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <Card className="w-full p-8 text-center">
          <h1 className="text-xl font-semibold">Login required</h1>
          <p className="mt-2 text-sm text-muted">
            Please log in to continue.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.push("/login")}
          >
            Go to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-12 sm:px-6 sm:py-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand"
      >
        ← Back
      </button>

      {/* Page heading */}
      <div className="mb-6">
        <p className="text-sm font-medium text-brand">My account</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Welcome back, {user.name?.split(" ")[0] || "there"} 👋
        </h1>

        <p className="mt-1 text-sm text-muted">
          Manage your orders, saved products, addresses and account settings.
        </p>
      </div>

      {/* Profile hero */}
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-brand to-brand/80 p-6 text-white sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold ring-1 ring-white/20">
                {(user.name?.charAt(0) || "U").toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{user.name}</p>

                <p className="mt-1 truncate text-sm text-white/80">
                  {user.email}
                </p>

                {user.phone && (
                  <p className="mt-1 text-sm text-white/80">
                    {user.phone}
                  </p>
                )}
              </div>
            </div>

            <Badge tone="success">Customer</Badge>
          </div>
        </div>

        {/* Account summary */}
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-medium text-muted">Account type</p>
            <p className="mt-1 text-sm font-semibold text-ink">Customer</p>
            <p className="mt-1 text-xs text-muted">SundayShop account</p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-muted">Contact</p>
            <p className="mt-1 truncate text-sm font-semibold text-ink">
              {user.phone || user.email || "Not provided"}
            </p>
            <p className="mt-1 text-xs text-muted">Registered contact</p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-muted">Account status</p>
            <p className="mt-1 text-sm font-semibold text-emerald-600">
              Active
            </p>
            <p className="mt-1 text-xs text-muted">
              Account in good standing
            </p>
          </div>
        </div>
      </Card>

      {/* Khata section */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">My Khata</h2>
          <p className="mt-1 text-sm text-muted">
            View your outstanding balance and transaction history.
          </p>
        </div>

        <Card className="overflow-hidden p-5 sm:p-6">
          {khataLoading ? (
            <div className="flex items-center gap-3 py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-brand" />
              <p className="text-sm text-muted">Loading your Khata...</p>
            </div>
          ) : khataError ? (
            <div className="py-4">
              <p className="text-sm text-red-600">{khataError}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-surface-2 p-5">
                <p className="text-sm font-medium text-muted">
                  Outstanding balance
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
                  {formatCurrency(khata?.balance || 0)}
                </p>

                <p className="mt-2 text-xs text-muted">
                  {khata && khata.balance > 0
                    ? "Amount pending to be paid"
                    : "You have no outstanding Khata balance."}
                </p>
               {khata && khata.balance > 0 && (
  <div className="mt-5">
    <Button
      className="w-full sm:w-auto"
      onClick={() => setShowKhataPayment((prev) => !prev)}
    >
      {showKhataPayment ? "Close payment options" : "Pay Khata"}
    </Button>

    {showKhataPayment && (
      <div className="mt-5 rounded-xl border border-border bg-white p-4 sm:p-5">
        <div className="mt-4">
  <label className="mb-2 block text-sm font-medium text-ink">
    Amount to pay
  </label>

  <input
    type="number"
    min="1"
    max={khata.balance}
    step="0.01"
    value={khataPaymentAmount}
    onChange={(e) => {
      setKhataPaymentAmount(e.target.value);
      setKhataPaymentError("");
    }}
    placeholder="Enter amount"
    className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand"
  />

  <button
    type="button"
    onClick={() => {
      setKhataPaymentAmount(khata.balance.toFixed(2));
      setKhataPaymentError("");
    }}
    className="mt-2 text-sm font-medium text-brand hover:underline"
  >
    Pay full balance ({formatCurrency(khata.balance)})
  </button>

  {khataPaymentError && (
    <p className="mt-2 text-sm text-red-600">
      {khataPaymentError}
    </p>
  )}
</div>
        <h3 className="font-semibold text-ink">
          Choose payment method
        </h3>

        <p className="mt-1 text-sm text-muted">
          Outstanding amount: {formatCurrency(khata.balance)}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { value: "upi", label: "UPI" },
            { value: "debit_card", label: "Debit Card" },
            { value: "credit_card", label: "Credit Card" },
            { value: "net_banking", label: "Net Banking" },
            { value: "wallet", label: "Wallet" },
          ].map((method) => (
            <label
              key={method.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                selectedKhataMethod === method.value
                  ? "border-brand bg-brand/5"
                  : "border-border hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name="khata-payment-method"
                value={method.value}
                checked={selectedKhataMethod === method.value}
                onChange={() => setSelectedKhataMethod(method.value)}
                className="accent-brand"
              />

              <span className="text-sm font-medium text-ink">
                {method.label}
              </span>
            </label>
          ))}
          <div className="mt-5 rounded-lg border border-border p-4">
  {selectedKhataMethod === "upi" && (
    <>
      <h4 className="font-semibold text-ink">UPI payment</h4>
      <label className="mt-3 block text-sm font-medium text-ink">
        Your UPI ID
      </label>
      <input
        type="text"
        placeholder="example@upi"
        disabled
        className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm"
      />
      <p className="mt-2 text-xs text-muted">
        UPI entry will be enabled through the payment gateway.
      </p>
    </>
  )}

  {(selectedKhataMethod === "debit_card" ||
    selectedKhataMethod === "credit_card") && (
    <>
      <h4 className="font-semibold text-ink">
        {selectedKhataMethod === "debit_card"
          ? "Debit card details"
          : "Credit card details"}
      </h4>
      <p className="mt-2 text-sm text-muted">
        Card details will be collected securely through the payment gateway.
      </p>
      <div className="mt-3 grid gap-3">
        <input disabled placeholder="Card number" className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm" />
        <input disabled placeholder="Cardholder name" className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input disabled placeholder="MM/YY" className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm" />
          <input disabled placeholder="CVV" className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm" />
        </div>
      </div>
    </>
  )}

  {selectedKhataMethod === "net_banking" && (
    <>
      <h4 className="font-semibold text-ink">Net banking</h4>
      <p className="mt-2 text-sm text-muted">
        You'll select your bank securely through the payment gateway.
      </p>
    </>
  )}

  {selectedKhataMethod === "wallet" && (
    <>
      <h4 className="font-semibold text-ink">Wallet payment</h4>
      <p className="mt-2 text-sm text-muted">
        Supported wallets will appear when the payment gateway is connected.
      </p>
    </>
  )}
</div>
        </div>

        <Button
          className="mt-5 w-full sm:w-auto"
          onClick={() => {
  const amount = Number(khataPaymentAmount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > khata.balance
  ) {
    setKhataPaymentError(
      "Enter an amount greater than ₹0 and not exceeding your outstanding balance."
    );
    return;
  }

  setKhataPaymentError(
    `Selected amount: ${formatCurrency(amount)}\nPayment method: ${selectedKhataMethod}\n\nPayment gateway integration will be added later.`
  );
}}
          
        >
          Continue to Pay
        </Button>

        <p className="mt-3 text-xs text-muted">
          Payment processing will be enabled once the payment gateway is connected.
        </p>
      </div>
    )}
  

  </div>
)}

              </div>

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-ink">
                    Transaction history
                  </h3>
                  <span className="text-xs text-muted">
                    {khata?.transactions.length || 0} transactions
                  </span>
                </div>

                {!khata?.transactions.length ? (
                  <div className="rounded-lg border border-border px-4 py-8 text-center">
                    <p className="font-medium text-ink">
                      No Khata transactions yet
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Your Pay Later purchases will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {khata.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink">
                              {transaction.description ||
                                (transaction.entry_type === "credit"
                                  ? "Pay Later purchase"
                                  : "Payment")}
                            </p>

                            <Badge
                              tone={
                                transaction.entry_type === "credit"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {transaction.entry_type === "credit"
                                ? "Credit"
                                : "Payment"}
                            </Badge>
                          </div>

                          <p className="mt-1 text-xs text-muted">
                            {new Date(
                              transaction.created_at
                            ).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>

                          {transaction.payment_method && (
                            <p className="mt-1 text-xs text-muted">
                              Payment method: {transaction.payment_method}
                            </p>
                          )}
                        </div>

                        <p
                          className={`text-base font-bold ${
                            transaction.entry_type === "credit"
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {transaction.entry_type === "credit" ? "+" : "-"}
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Account navigation */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">Your account</h2>
          <p className="mt-1 text-sm text-muted">
            Everything you need to manage your SundayShop experience.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="flex items-center justify-between p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-surface-2 group-hover:shadow-md">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{link.label}</p>

                  <p className="mt-1 text-xs text-muted">
                    {link.label === "Orders" &&
                      "Track and manage your purchases"}
                    {link.label === "Wishlist" &&
                      "View products you've saved"}
                    {link.label === "Loyalty" &&
                      "View your loyalty benefits"}
                    {link.label === "Returns" &&
                      "Manage returns and refunds"}
                    {link.label === "Address Book" &&
                      "Manage your saved delivery addresses"}
                    {link.label === "Settings" &&
                      "Manage your account preferences"}
                  </p>
                </div>

                <span className="ml-4 shrink-0 text-lg text-muted transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact information */}
      <Card className="mt-8 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Contact information
          </h2>
          <p className="mt-1 text-sm text-muted">
            Your registered customer details.
          </p>
        </div>

        <div className="mt-4 divide-y divide-border">
          <div className="py-4">
            <p className="text-xs text-muted">Full name</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {user.name || "Not provided"}
            </p>
          </div>

          <div className="py-4">
            <p className="text-xs text-muted">Email address</p>
            <p className="mt-1 break-all text-sm font-semibold text-ink">
              {user.email || "Not provided"}
            </p>
          </div>

          <div className="py-4">
            <p className="text-xs text-muted">Phone number</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {user.phone || "Not provided"}
            </p>
          </div>
        </div>
      </Card>

      {/* Account access */}
      <Card className="mt-6 border-red-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">Account access</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Sign out of your SundayShop account on this device.
          </p>
        </div>

        <Button
          variant="outline"
          className="mt-5 border-red-200 text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:scale-[0.98]"
          onClick={logout}
        >
          Log out
        </Button>
      </Card>
    </div>
  );
}
