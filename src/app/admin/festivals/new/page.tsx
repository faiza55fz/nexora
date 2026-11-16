
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  brand: string;
  active: boolean;
  moderation_status?: string;
  product_variants?: {
    id: string;
    selling_price: number;
    mrp: number;
    active: boolean;
  }[];
  product_images?: {
    image_url: string;
    display_order: number;
    is_primary: boolean;
  }[];
};

const festivals = [
  "Diwali",
  "Holi",
  "Eid al-Fitr",
  "Eid al-Adha",
  "Onam",
  "Pongal",
  "Christmas",
  "New Year",
  "Navratri",
  "Durga Puja",
  "Raksha Bandhan",
  "Ganesh Chaturthi",
  "Ugadi",
  "Baisakhi",
  "Other",
];

const themes = [
  { value: "diwali", label: "Diwali", color: "#F59E0B" },
  { value: "holi", label: "Holi", color: "#EC4899" },
  { value: "eid", label: "Eid", color: "#15803D" },
  { value: "onam", label: "Onam", color: "#EAB308" },
  { value: "christmas", label: "Christmas", color: "#DC2626" },
  { value: "pongal", label: "Pongal", color: "#EA580C" },
  { value: "default", label: "Custom", color: "#EA580C" },
];

export default function NewFestivalCampaignPage() {
  const [festivalName, setFestivalName] = useState("Diwali");
  const [campaignName, setCampaignName] = useState("");
  const [heading, setHeading] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [theme, setTheme] = useState("diwali");
  const [backgroundColor, setBackgroundColor] = useState("#7C2D12");
  const [buttonText, setButtonText] = useState("Shop Now");

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, number>
  >({});
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      setProductError("");

      try {
        const response = await fetch("/api/products?admin=true");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load products.");
        }

        setProducts(result.products ?? []);
      } catch (err) {
        setProductError(
          err instanceof Error
            ? err.message
            : "Could not load products.",
        );
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const search = productSearch.toLowerCase().trim();

    return products.filter((product) =>
      `${product.name} ${product.brand || ""}`
        .toLowerCase()
        .includes(search),
    );
  }, [products, productSearch]);

  const selectedCount = Object.keys(selectedProducts).length;

  function toggleProduct(productId: string) {
    setSelectedProducts((current) => {
      const updated = { ...current };

      if (productId in updated) {
        delete updated[productId];
      } else {
        updated[productId] = 10;
      }

      return updated;
    });
  }

  function updateDiscount(productId: string, discount: number) {
    setSelectedProducts((current) => ({
      ...current,
      [productId]: discount,
    }));
  }

  async function handleSaveDraft() {
    setError("");

    if (!festivalName.trim() || !campaignName.trim()) {
      setError("Please enter the festival and campaign name.");
      return;
    }

    setSaving(true);

    try {
      const campaignProducts = Object.entries(selectedProducts).map(
        ([productId, festiveDiscount], index) => ({
          productId,
          festiveDiscount,
          displayOrder: index,
        }),
      );

      const response = await fetch("/api/admin/festival-campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          festivalName,
          campaignName,
          heading,
          subtitle,
          theme,
          backgroundColor,
          buttonText,
          status: "draft",
          products: campaignProducts,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not save campaign.");
      }

      window.location.href = "/admin/festivals";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  function getProductImage(product: Product) {
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => {
        if (a.is_primary !== b.is_primary) {
          return a.is_primary ? -1 : 1;
        }

        return a.display_order - b.display_order;
      },
    );

    return images[0]?.image_url || "";
  }

  function getProductPrice(product: Product) {
    const variant = product.product_variants?.find(
      (item) => item.active,
    );

    return variant?.selling_price ?? null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/admin/festivals"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back to Festival Campaigns
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Create Festival Campaign
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Set up your festival theme, offers and promotional content.
        </p>
      </div>

      {/* Festival Details */}
      <section className="space-y-5 rounded-xl border bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            1. Festival Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose the occasion for your campaign.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Festival
          </label>

          <select
            value={festivalName}
            onChange={(event) => setFestivalName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-orange-500"
          >
            {festivals.map((festival) => (
              <option key={festival} value={festival}>
                {festival}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Campaign Name
          </label>

          <input
            value={campaignName}
            onChange={(event) => setCampaignName(event.target.value)}
            placeholder="e.g. Diwali Mega Sale 2026"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-orange-500"
          />
        </div>
      </section>

      {/* Banner Content */}
      <section className="space-y-5 rounded-xl border bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            2. Banner Content
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize the message customers will see.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Main Heading
          </label>

          <input
            value={heading}
            onChange={(event) => setHeading(event.target.value)}
            placeholder="e.g. Celebrate Diwali with Special Offers!"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Subtitle
          </label>

          <textarea
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            rows={3}
            placeholder="e.g. Bring home the festive joy with amazing savings."
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Button Text
          </label>

          <input
            value={buttonText}
            onChange={(event) => setButtonText(event.target.value)}
            placeholder="Shop Now"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-orange-500"
          />
        </div>
      </section>

      {/* Festival Theme */}
      <section className="space-y-5 rounded-xl border bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            3. Festival Theme
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose a visual theme and background colour.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {themes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setTheme(item.value);
                setBackgroundColor(item.color);
              }}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${
                theme === item.value
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span
                className="mb-2 block h-9 rounded-lg"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Custom Background Colour
          </label>

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="h-12 w-16 cursor-pointer rounded border-0"
            />

            <span className="text-sm text-gray-600">
              {backgroundColor}
            </span>
          </div>
        </div>

        {/* Banner Preview */}
        <div
          className="rounded-xl p-6 text-white"
          style={{ backgroundColor }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
            {festivalName} Special
          </p>

          <h3 className="mt-3 text-2xl font-bold">
            {heading || "Your Festival Heading"}
          </h3>

          <p className="mt-2 text-sm opacity-90">
            {subtitle || "Your campaign subtitle will appear here."}
          </p>

          <span className="mt-5 inline-block rounded-lg bg-white px-5 py-2 text-sm font-bold text-gray-900">
            {buttonText || "Shop Now"}
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Basic banner preview. Product images will be incorporated into
          the final festive banner.
        </p>
      </section>

      {/* Product Selection */}
      <section className="space-y-5 rounded-xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              4. Select Festival Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose the products you want to include in this campaign.
            </p>
          </div>

          <span className="rounded-full bg-orange-100 px-3 py-1.5 text-sm font-semibold text-orange-700">
            {selectedCount} selected
          </span>
        </div>

        <input
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
          placeholder="Search products by name or brand..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
        />

        {productError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {productError}
          </div>
        )}

        {loadingProducts ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading your products...
          </div>
        ) : productError ? null : filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredProducts.map((product) => {
              const selected = product.id in selectedProducts;
              const image = getProductImage(product);
              const price = getProductPrice(product);

              const canSelect =
                product.active !== false &&
                product.moderation_status === "approved";

              return (
                <div
                  key={product.id}
                  className={`flex gap-3 rounded-xl border p-3 transition ${
                    selected
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200"
                  } ${!canSelect ? "opacity-60" : ""}`}
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {product.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {product.brand}
                    </p>

                    {price !== null && (
                      <p className="mt-1 text-xs font-medium text-gray-700">
                        ₹{Number(price).toFixed(2)}
                      </p>
                    )}

                    {!canSelect && (
                      <p className="mt-1 text-xs text-red-600">
                        {product.active === false
                          ? "Inactive product"
                          : "Not approved"}
                      </p>
                    )}

                    <div className="mt-2">
                      <button
  type="button"
  disabled={!canSelect}
  onClick={() => toggleProduct(product.id)}
  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
    selected
      ? "bg-green-600 text-white"
      : "bg-orange-600 text-white hover:bg-orange-700"
  } disabled:cursor-not-allowed`}
>
  {selected ? "✓ Added" : "+ Add Product"}
</button>
                    </div>
                  </div>

                  {selected && (
                    <div className="w-20 shrink-0">
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Discount %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="90"
                        step="0.5"
                        value={selectedProducts[product.id]}
                        onChange={(event) =>
                          updateDiscount(
                            product.id,
                            Number(event.target.value),
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedCount > 0 && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">
              {selectedCount} products added to this campaign
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Each selected product will have its own festive discount.
              You can change the percentage before saving.
            </p>
          </div>
        )}
      </section>

      {/* Errors */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href="/admin/festivals"
          className="rounded-lg border px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || loadingProducts}
          className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
      </div>
    </div>
  );
}
