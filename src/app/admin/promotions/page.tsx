"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_order_value: number | null;
  maximum_discount: number | null;
  expires_at: string | null;
  first_order_only: boolean;
};

function formatDiscount(coupon: Coupon) {
  if (coupon.discount_type === "percentage") {
    return `${coupon.discount_value}% off`;
  }

  return `₹${coupon.discount_value} off`;
}

function formatExpiry(value: string | null) {
  if (!value) return "No expiry";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PromosPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed"
  >("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumOrderValue, setMinimumOrderValue] =
    useState("");
  const [maximumDiscount, setMaximumDiscount] =
    useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [firstOrderOnly, setFirstOrderOnly] =
    useState(false);

  async function loadCoupons() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/coupons", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load promotions.",
        );
      }

      setCoupons(data.coupons ?? []);
    } catch (error) {
      console.error(
        "Loading promotions failed:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load promotions.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinimumOrderValue("");
    setMaximumDiscount("");
    setUsageLimit("");
    setExpiresAt("");
    setFirstOrderOnly(false);
    setCreateError("");
    setCreateSuccess("");
  }

  function closeCreateForm() {
    if (creating) return;

    resetForm();
    setShowCreateForm(false);
  }

  async function createPromotion(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      const response = await fetch(
        "/api/admin/promotions",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            discountType,
            discountValue,
            minimumOrderValue,
            maximumDiscount,
            usageLimit,
            expiresAt,
            firstOrderOnly,
          }),
        },
      );

      const text = await response.text();

let data: any = {};

if (text) {
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create promotion.",
        );
      }

      setCreateSuccess(
        `Promotion ${data.coupon.code} created successfully.`,
      );

      resetForm();
      setCreateSuccess(
        `Promotion ${data.coupon.code} created successfully.`,
      );

      await loadCoupons();
    } catch (error) {
      console.error(
        "Creating promotion failed:",
        error,
      );

      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create promotion.",
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void loadCoupons();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        subtitle="Manage offers and coupon codes available to customers."
      />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setShowCreateForm((current) => !current);
            setCreateError("");
            setCreateSuccess("");
          }}
        >
          {showCreateForm
            ? "Close"
            : "Add Promotion"}
        </Button>
      </div>

      {showCreateForm ? (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Create promotion
            </h2>
            <p className="mt-1 text-sm text-muted">
              Create a coupon that customers can use at checkout.
            </p>
          </div>

          <form
            onSubmit={createPromotion}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">
                  Promotion code
                </span>

                <input
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/\s/g, ""),
                    )
                  }
                  placeholder="SAVE20"
                  maxLength={30}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Discount type
                </span>

                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(
                      event.target.value as
                        | "percentage"
                        | "fixed",
                    )
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                >
                  <option value="percentage">
                    Percentage
                  </option>
                  <option value="fixed">
                    Fixed amount
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Discount value
                </span>

                <input
                  type="number"
                  min="1"
                  max={
                    discountType === "percentage"
                      ? "100"
                      : undefined
                  }
                  step="0.01"
                  value={discountValue}
                  onChange={(event) =>
                    setDiscountValue(
                      event.target.value,
                    )
                  }
                  placeholder={
                    discountType === "percentage"
                      ? "20"
                      : "100"
                  }
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Minimum order value
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumOrderValue}
                  onChange={(event) =>
                    setMinimumOrderValue(
                      event.target.value,
                    )
                  }
                  placeholder="500"
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Maximum discount
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maximumDiscount}
                  onChange={(event) =>
                    setMaximumDiscount(
                      event.target.value,
                    )
                  }
                  placeholder="200"
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                />

                <span className="mt-1 block text-xs text-muted">
                  Optional cap for the discount.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Usage limit
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={usageLimit}
                  onChange={(event) =>
                    setUsageLimit(
                      event.target.value,
                    )
                  }
                  placeholder="100"
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                />

                <span className="mt-1 block text-xs text-muted">
                  Leave empty for unlimited use.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Expiry date
                </span>

                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) =>
                    setExpiresAt(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
                />

                <span className="mt-1 block text-xs text-muted">
                  Leave empty for no expiry.
                </span>
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-4">
              <input
                type="checkbox"
                checked={firstOrderOnly}
                onChange={(event) =>
                  setFirstOrderOnly(
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />

              <span>
                <span className="block text-sm font-medium">
                  First order only
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Only customers who have never placed an order can use this promotion.
                </span>
              </span>
            </label>

            {createError ? (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                <p className="text-sm text-danger">
                  {createError}
                </p>
              </div>
            ) : null}

            {createSuccess ? (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <p className="text-sm text-success">
                  {createSuccess}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create & Publish"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={closeCreateForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-5 w-48 animate-pulse rounded bg-surface-2" />
            <div className="h-20 animate-pulse rounded bg-surface-2" />
            <div className="h-20 animate-pulse rounded bg-surface-2" />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="font-medium text-danger">
            Unable to load promotions
          </p>
          <p className="mt-1 text-sm text-muted">
            {error}
          </p>
        </Card>
      ) : coupons.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-semibold">
            No active promotions
          </p>

          <p className="mt-2 text-sm text-muted">
            Create your first promotion above.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">
                      {coupon.code}
                    </Badge>

                    <Badge tone="success">
                      Active
                    </Badge>

                    {coupon.first_order_only ? (
                      <Badge tone="muted">
                        First order
                      </Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold">
                    {formatDiscount(coupon)}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    {coupon.minimum_order_value
                      ? `Minimum order ₹${coupon.minimum_order_value}`
                      : "No minimum order"}
                  </p>

                  {coupon.maximum_discount ? (
                    <p className="mt-1 text-sm text-muted">
                      Maximum discount ₹
                      {coupon.maximum_discount}
                    </p>
                  ) : null}
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-muted">
                    Expires
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatExpiry(
                      coupon.expires_at,
                    )}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}