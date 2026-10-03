"use client";

import { useState } from "react";
import { useStore } from "@/components/providers";

type DeliveryTipProps = {
  orderId: string;
};

export function DeliveryTip({
  orderId,
}: DeliveryTipProps) {
  const { user } = useStore();

  const [selectedAmount, setSelectedAmount] =
    useState<number | null>(null);
  const [customAmount, setCustomAmount] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const amount =
    selectedAmount ??
    Number(customAmount);

  const handleTip = async () => {
    if (!user?.id) {
      setMessage(
        "Please log in to add a tip.",
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 500
    ) {
      setMessage(
        "Please enter a tip between ₹1 and ₹500.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/delivery/tip",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            customerId: user.id,
            amount,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ??
            "Unable to add tip.",
        );
        return;
      }

      setMessage(
        `₹${amount} tip added successfully.`,
      );
    } catch (error) {
      console.error(
        "Tip request failed:",
        error,
      );

      setMessage(
        "Unable to add tip. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold">
        Tip your delivery partner
      </p>

      <p className="mt-1 text-xs text-muted">
        Show your appreciation for the delivery.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {[10, 20, 30].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setSelectedAmount(value);
              setCustomAmount("");
              setMessage("");
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              selectedAmount === value
                ? "border-brand bg-brand text-white"
                : "border-border hover:border-brand"
            }`}
          >
            ₹{value}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          min="1"
          max="500"
          step="1"
          value={customAmount}
          onChange={(event) => {
            setCustomAmount(
              event.target.value,
            );
            setSelectedAmount(null);
            setMessage("");
          }}
          placeholder="Custom amount"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand"
        />

        <button
          type="button"
          onClick={handleTip}
          disabled={
            loading ||
            !user?.id ||
            !Number.isFinite(amount) ||
            amount <= 0
          }
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Adding..."
            : "Add tip"}
        </button>
      </div>

      {message && (
        <p className="mt-2 text-xs text-muted">
          {message}
        </p>
      )}
    </div>
  );
}