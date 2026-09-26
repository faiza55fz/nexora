"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  Truck,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { useStore } from "@/components/providers";
import { Button, Card } from "@/components/ui";
import { products as staticProducts } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import LocationPicker from "@/components/location-picker";
import { Suspense } from "react";
const steps = ["Address", "Delivery", "Payment", "Review"];

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
};

type ExistingOrder = {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  status: string;
  order_items: {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }[];
};

export default function CheckoutPage() {
  const { user, cart, clearCart } = useStore();

  const searchParams = useSearchParams();
  const addToOrderId = searchParams.get("addToOrder") || "";

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressesLoading, setAddressesLoading] =
    useState(true);
  const [showAddressOptions, setShowAddressOptions] =
    useState(false);

  const [selectedLatitude, setSelectedLatitude] =
    useState<number | null>(null);
  const [selectedLongitude, setSelectedLongitude] =
    useState<number | null>(null);

  const [orderId, setOrderId] = useState("");
  const [existingOrder, setExistingOrder] =
    useState<ExistingOrder | null>(null);

  const [allProducts, setAllProducts] =
    useState(staticProducts);
    const [paymentMethod, setPaymentMethod] = useState<
  "cod" | "card" | "upi" | "wallet"
>("cod");

const [cardNumber, setCardNumber] = useState("");
const [cardName, setCardName] = useState("");
const [cardExpiry, setCardExpiry] = useState("");
const [cardCvv, setCardCvv] = useState("");
const [upiId, setUpiId] = useState("");
const [wallet, setWallet] = useState("paytm");

  useEffect(() => {
    async function loadAddresses() {
      setAddressesLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setAddressesLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", currentUser.id)
        .order("is_default", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Failed to load addresses:",
          error,
        );
        setAddresses([]);
      } else {
        const loadedAddresses = data ?? [];

        setAddresses(loadedAddresses);

        const defaultAddress =
          loadedAddresses.find(
            (address) => address.is_default,
          ) ?? loadedAddresses[0];

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }

      setAddressesLoading(false);
    }

    loadAddresses();
  }, []);

  useEffect(() => {
    if (!addToOrderId) return;

    async function loadExistingOrder() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Your session has expired. Please log in again.",
          );
        }

        const response = await fetch("/api/orders/my", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load your existing order.",
          );
        }

        const order = data.orders?.find(
          (item: ExistingOrder) =>
            item.id === addToOrderId,
        );

        if (!order) {
          throw new Error(
            "Existing order could not be found.",
          );
        }

        setExistingOrder(order);
        setOrderId(order.order_number);
      } catch (error) {
        console.error(
          "Failed to load existing order:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your existing order.",
        );
      }
    }

    loadExistingOrder();
  }, [addToOrderId]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load products",
          );
        }

        const mappedProducts = result.products.map(
          (product: any) => {
            const variant =
              product.product_variants?.find(
                (item: any) => item.active !== false,
              ) ||
              product.product_variants?.[0];

            const inventory = variant?.inventory;

            const images =
              product.product_images
                ?.map(
                  (image: any) => image.image_url,
                )
                .filter(Boolean) || [];

            const primaryImage =
              product.product_images?.find(
                (image: any) => image.is_primary,
              )?.image_url ||
              images[0] ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80";

            return {
              ...staticProducts[0],
              id: product.id,
              variantId: variant?.id,
              name: product.name,
              brand: product.brand || "",
              category:
                product.categories?.name?.toLowerCase() ||
                "fruits",
              subcategory:
                product.subcategory || "",
              description:
                product.description || "",
              active:
                product.active !== false,
              rating:
                Number(product.rating || 0),
              reviewCount:
                Number(product.review_count || 0),
              mrp:
                Number(variant?.mrp || 0),
              price:
                Number(variant?.selling_price || 0),
              gstRate:
                Number(variant?.gst_rate || 0),
              stock:
                Number(
                  inventory?.stock_quantity || 0,
                ),
              deliveryEta: "Tomorrow",
              specs: {
                Unit:
                  variant?.variant_name || "",
              },
              image: primaryImage,
              images:
                images.length > 0
                  ? images
                  : [primaryImage],
              sold: 0,
              sellerId: "nexora",
              location: "",
              tags: [],
              highlights: [],
              moq: 1,
              tiers: [],
            };
          },
        );

        setAllProducts(mappedProducts);
      } catch (error) {
        console.error(
          "Failed to load products:",
          error,
        );

        setAllProducts([]);
      }
    }

    loadProducts();
  }, []);

  const rows = cart
    .map((item) => {
      const product = allProducts.find(
        (p) => p.id === item.productId,
      );

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
        product: (typeof staticProducts)[number];
      } => row !== null,
    );

  const subtotal = rows.reduce(
    (sum, row) =>
      sum + row.product.price * row.qty,
    0,
  );

  const deliveryFee =
    subtotal === 0 || subtotal >= 499 ? 0 : 49;

  const total = subtotal + deliveryFee;

  const selectedAddress = addresses.find(
    (address) =>
      address.id === selectedAddressId,
  );

  /*
   * Keep the map location synchronized with
   * the currently selected saved address.
   */
  useEffect(() => {
    if (!selectedAddress) {
      setSelectedLatitude(null);
      setSelectedLongitude(null);
      return;
    }

    setSelectedLatitude(
      selectedAddress.latitude ?? null,
    );

    setSelectedLongitude(
      selectedAddress.longitude ?? null,
    );
  }, [selectedAddress]);

  const formattedAddress = selectedAddress
    ? [
        selectedAddress.address_line1,
        selectedAddress.address_line2,
        selectedAddress.landmark,
        `${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const selectAddress = (id: string) => {
    setSelectedAddressId(id);
    setShowAddressOptions(false);
    setError("");
  };

  const placeOrder = async () => {
    setError("");

    if (!selectedAddress) {
      setError(
        "Please select a delivery address.",
      );
      setStep(0);
      return;
    }

    if (!rows.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!user?.email) {
      setError(
        "Your account email is missing. Please log in again.",
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * ADD MORE ITEMS TO EXISTING ORDER
       *
       * When checkout is opened with:
       * /checkout?addToOrder=ORDER_ID
       *
       * update the existing order instead of
       * creating a new order.
       */
      if (addToOrderId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Your session has expired. Please log in again.",
          );
        }

        const response = await fetch(
          "/api/orders/add-items",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              orderId: addToOrderId,
              items: rows.map((row) => ({
                productId: row.product.id,
                productName: row.product.name,
                quantity: row.qty,
                price: row.product.price,
                variantId:
                  (row.product as any).variantId ||
                  undefined,
              })),
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to update the existing order.",
          );
        }

        const ordersResponse = await fetch(
          "/api/orders/my",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          },
        );

        const ordersData =
          await ordersResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(
            ordersData.error ||
              "Unable to load the updated order.",
          );
        }

        const updatedOrder =
          ordersData.orders?.find(
            (order: ExistingOrder) =>
              order.id === addToOrderId,
          );

        if (!updatedOrder) {
          throw new Error(
            "The order was updated, but its invoice could not be loaded.",
          );
        }

        setExistingOrder(updatedOrder);
        setOrderId(updatedOrder.order_number);

        clearCart();
        setDone(true);

        return;
      }

      /*
       * NORMAL NEW ORDER
       */
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName:
            selectedAddress.full_name.trim(),

          customerEmail: user.email,

          customerPhone:
            selectedAddress.phone.trim(),

          address: formattedAddress,

          subtotal,

          deliveryFee,

          total,

          paymentMethod,

          latitude: selectedLatitude,

          longitude: selectedLongitude,

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
        throw new Error(
          data.error || "Unable to place order.",
        );
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

            <h1 className="mt-4 text-3xl font-bold">
              Checkout
            </h1>

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

                <span className="sm:hidden">
                  {i + 1}
                </span>
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
                        Select where you'd like your groceries
                        delivered.
                      </p>
                    </div>
                  </div>

                  {addressesLoading ? (
                    <div className="rounded-2xl border border-line p-5 text-sm text-muted">
                      Loading your saved addresses...
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="rounded-2xl border border-line p-6 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
                        <MapPin size={22} />
                      </div>

                      <h3 className="mt-4 font-semibold">
                        No saved address yet
                      </h3>

                      <p className="mt-1 text-sm text-muted">
                        Add a delivery address to continue
                        with your order.
                      </p>

                      <Link
                        href="/account/addresses"
                        className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
                      >
                        Add an address →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selected address */}
                      {selectedAddress ? (
                        <div className="rounded-2xl border-2 border-brand bg-brand-soft p-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <input
                                type="radio"
                                checked
                                readOnly
                                className="h-4 w-4 accent-brand"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">
                                  {selectedAddress.label}
                                </span>

                                {selectedAddress.is_default ? (
                                  <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                                    Default
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 font-medium">
                                {selectedAddress.full_name}
                              </p>

                              <p className="mt-1 text-sm text-muted">
                                {formattedAddress}
                              </p>

                              <p className="mt-2 text-sm text-muted">
                                📞 {selectedAddress.phone}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setShowAddressOptions(
                                  (value) => !value,
                                )
                              }
                              className="text-sm font-semibold text-brand hover:underline"
                            >
                              {showAddressOptions
                                ? "Close"
                                : "Change address"}
                            </button>

                            <Link
                              href="/account/addresses"
                              className="text-sm font-semibold text-muted hover:text-brand hover:underline"
                            >
                              Manage addresses
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {/* Address options */}
                      {showAddressOptions ? (
                        <div className="space-y-3 rounded-2xl border border-line p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold">
                              Choose an address
                            </h3>

                            <Link
                              href="/account/addresses"
                              className="text-sm font-semibold text-brand hover:underline"
                            >
                              + Add new
                            </Link>
                          </div>

                          {addresses.map((addressOption) => {
                            const isSelected =
                              addressOption.id ===
                              selectedAddressId;

                            const optionAddress = [
                              addressOption.address_line1,
                              addressOption.address_line2,
                              addressOption.landmark,
                              `${addressOption.city}, ${addressOption.state} - ${addressOption.pincode}`,
                            ]
                              .filter(Boolean)
                              .join(", ");

                            return (
                              <button
                                key={addressOption.id}
                                type="button"
                                onClick={() =>
                                  selectAddress(
                                    addressOption.id,
                                  )
                                }
                                className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                                  isSelected
                                    ? "border-brand bg-brand-soft"
                                    : "border-line hover:border-brand/50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="radio"
                                    checked={isSelected}
                                    readOnly
                                    className="mt-1 h-4 w-4 accent-brand"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold">
                                        {
                                          addressOption.label
                                        }
                                      </span>

                                      {addressOption.is_default ? (
                                        <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                                          Default
                                        </span>
                                      ) : null}
                                    </div>

                                    <p className="mt-1 font-medium">
                                      {
                                        addressOption.full_name
                                      }
                                    </p>

                                    <p className="mt-1 text-sm text-muted">
                                      {optionAddress}
                                    </p>

                                    <p className="mt-1 text-sm text-muted">
                                      📞{" "}
                                      {
                                        addressOption.phone
                                      }
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="rounded-xl bg-brand-soft p-3 text-sm text-brand">
                        📍 Your selected delivery address will
                        be used for your order.
                      </div>

                      {/* Exact delivery location map */}
                      <LocationPicker
                        latitude={selectedLatitude}
                        longitude={selectedLongitude}
                        onLocationChange={(lat, lng) => {
                          setSelectedLatitude(lat);
                          setSelectedLongitude(lng);
                        }}
                      />
                    </div>
                  )}
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
                      <CheckCircle2
                        size={20}
                        className="text-success"
                      />

                      <div>
                        <p className="font-semibold">
                          Freshness guaranteed
                        </p>

                        <p className="text-sm text-muted">
                          Your groceries are packed close to
                          delivery time.
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
          Choose how you'd like to pay for your groceries.
        </p>
      </div>
    </div>
     {/* Cash on Delivery */}
    <button
      type="button"
      onClick={() => setPaymentMethod("cod")}
      className={`w-full rounded-2xl border-2 p-5 text-left transition ${
        paymentMethod === "cod"
          ? "border-brand bg-brand-soft"
          : "border-line hover:border-brand/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <input
          type="radio"
          name="payment"
          checked={paymentMethod === "cod"}
          onChange={() => setPaymentMethod("cod")}
          className="h-4 w-4 accent-brand"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <strong>Cash on Delivery</strong>
            <span className="text-xl">💵</span>
          </div>

          <p className="mt-1 text-sm text-muted">
            Pay when your groceries arrive at your doorstep.
          </p>
        </div>
      </div>
    </button>

    {/* Credit / Debit Card */}
    <button
      type="button"
      onClick={() => setPaymentMethod("card")}
      className={`w-full rounded-2xl border-2 p-5 text-left transition ${
        paymentMethod === "card"
          ? "border-brand bg-brand-soft"
          : "border-line hover:border-brand/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <input
          type="radio"
          name="payment"
          checked={paymentMethod === "card"}
          onChange={() => setPaymentMethod("card")}
          className="h-4 w-4 accent-brand"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <strong>Credit / Debit Card</strong>
            <span className="text-xl">💳</span>
          </div>

          <p className="mt-1 text-sm text-muted">
            Pay securely using your credit or debit card.
          </p>
        </div>
      </div>
    </button>

    {paymentMethod === "card" ? (
      <div className="rounded-2xl border border-line p-5">
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Card Number
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(e.target.value)
              }
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Cardholder Name
            </label>

            <input
              type="text"
              placeholder="Name on card"
              value={cardName}
              onChange={(e) =>
                setCardName(e.target.value)
              }
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Expiry Date
              </label>

              <input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                value={cardExpiry}
                onChange={(e) =>
                  setCardExpiry(e.target.value)
                }
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                CVV
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="•••"
                value={cardCvv}
                onChange={(e) =>
                  setCardCvv(e.target.value)
                }
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>
      </div>
    ) : null}

    {/* UPI / Net Banking */}
    <button
      type="button"
      onClick={() => setPaymentMethod("upi")}
      className={`w-full rounded-2xl border-2 p-5 text-left transition ${
        paymentMethod === "upi"
          ? "border-brand bg-brand-soft"
          : "border-line hover:border-brand/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <input
          type="radio"
          name="payment"
          checked={paymentMethod === "upi"}
          onChange={() => setPaymentMethod("upi")}
          className="h-4 w-4 accent-brand"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <strong>UPI / Net Banking</strong>
            <span className="text-xl">📱</span>
          </div>

          <p className="mt-1 text-sm text-muted">
            Pay using UPI or your bank account.
          </p>
        </div>
      </div>
    </button>

    {paymentMethod === "upi" ? (
      <div className="rounded-2xl border border-line p-5">
        <label className="mb-1.5 block text-sm font-medium">
          UPI ID
        </label>

        <input
          type="text"
          placeholder="yourname@upi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand"
        />

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full bg-surface-2 px-3 py-1">
            Google Pay
          </span>

          <span className="rounded-full bg-surface-2 px-3 py-1">
            PhonePe
          </span>

          <span className="rounded-full bg-surface-2 px-3 py-1">
            Paytm
          </span>

          <span className="rounded-full bg-surface-2 px-3 py-1">
            Net Banking
          </span>
        </div>
      </div>
    ) : null}

    {/* Digital Wallet */}
    <button
      type="button"
      onClick={() => setPaymentMethod("wallet")}
      className={`w-full rounded-2xl border-2 p-5 text-left transition ${
        paymentMethod === "wallet"
          ? "border-brand bg-brand-soft"
          : "border-line hover:border-brand/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <input
          type="radio"
          name="payment"
          checked={paymentMethod === "wallet"}
          onChange={() => setPaymentMethod("wallet")}
          className="h-4 w-4 accent-brand"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <strong>Digital Wallets</strong>
            <span className="text-xl">👛</span>
          </div>

          <p className="mt-1 text-sm text-muted">
            Pay using your preferred digital wallet.
          </p>
        </div>
      </div>
    </button>

    {paymentMethod === "wallet" ? (
      <div className="rounded-2xl border border-line p-5">
        <label className="mb-1.5 block text-sm font-medium">
          Select Wallet
        </label>

        <select
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand"
        >
          <option value="paytm">Paytm Wallet</option>
          <option value="amazon_pay">Amazon Pay</option>
          <option value="mobikwik">MobiKwik</option>
        </select>
      </div>
    ) : null}

    {/* Security message */}
    <div className="flex gap-3 rounded-xl bg-surface-2 p-4">
      <ShieldCheck
        size={20}
        className="shrink-0 text-success"
      />

      <p className="text-sm text-muted">
        Your payment information is protected. We never store
        your complete card details.
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
                      Please check everything before placing
                      your order.
                    </p>
                  </div>

                  {addToOrderId && existingOrder ? (
                    <div className="rounded-2xl border border-line p-5">
                      <h3 className="font-semibold">
                        Updated order
                      </h3>

                      <p className="mt-1 text-sm text-muted">
                        Your existing items and the new items you're adding
                        are shown below.
                      </p>

                      <div className="mt-4 space-y-2 text-sm">
                        {existingOrder.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-4"
                          >
                            <span>
                              {item.product_name} ×{" "}
                              {item.quantity}
                            </span>

                            <span>
                              ₹
                              {(
                                Number(item.price) *
                                item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}

                        {rows.map((row) => (
                          <div
                            key={`new-${row.product.id}`}
                            className="flex justify-between gap-4"
                          >
                            <span>
                              {row.product.name} × {row.qty}
                            </span>

                            <span>
                              ₹
                              {(
                                row.product.price *
                                row.qty
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}

                        {(() => {
                          const newItemsSubtotal =
                            rows.reduce(
                              (sum, row) =>
                                sum +
                                row.product.price *
                                  row.qty,
                              0,
                            );

                          const updatedSubtotal =
                            Number(
                              existingOrder.subtotal,
                            ) + newItemsSubtotal;

                          const updatedDeliveryFee =
                            updatedSubtotal === 0 ||
                            updatedSubtotal >= 499
                              ? 0
                              : 49;

                          const updatedTotal =
                            updatedSubtotal +
                            updatedDeliveryFee;

                          return (
                            <div className="mt-3 space-y-2 border-t border-line pt-3">
                              <div className="flex justify-between">
                                <span className="text-muted">
                                  Subtotal
                                </span>

                                <span>
                                  ₹
                                  {updatedSubtotal.toFixed(
                                    2,
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted">
                                  Delivery
                                </span>

                                <span
                                  className={
                                    updatedDeliveryFee ===
                                    0
                                      ? "text-success"
                                      : undefined
                                  }
                                >
                                  {updatedDeliveryFee === 0
                                    ? "FREE"
                                    : `₹${updatedDeliveryFee.toFixed(
                                        2,
                                      )}`}
                                </span>
                              </div>

                              <div className="flex justify-between font-bold">
                                <span>Total</span>

                                <span>
                                  ₹
                                  {updatedTotal.toFixed(
                                    2,
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3 rounded-2xl bg-surface-2 p-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">
                        Deliver to
                      </span>

                      <strong className="max-w-[70%] text-right">
                        {formattedAddress ||
                          "Delivery address not selected"}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">
                        Delivery
                      </span>

                      <strong>
                        Tomorrow by 8 PM
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">
                        Payment
                      </span>

                      <strong>
                       {paymentMethod === "cod"
    ? "Cash on delivery"
    : paymentMethod === "card"
      ? "Credit / Debit Card"
      : paymentMethod === "upi"
        ? "UPI / Net Banking"
        : "Digital Wallet"}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-brand/20 bg-brand-soft p-4">
                    <p className="text-sm font-semibold text-brand">
                      🚚 Your order will be delivered within
                      1 day.
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
                  onClick={() =>
                    setStep((s) => s - 1)
                  }
                >
                  Back
                </Button>

                {step < 3 ? (
                  <Button
                    size="lg"
                    disabled={
                      step === 0 &&
                      (!selectedAddress ||
                        addressesLoading)
                    }
                    onClick={() => {
                      setError("");

                      if (
                        step === 0 &&
                        !selectedAddress
                      ) {
                        setError(
                          "Please select a delivery address.",
                        );
                        return;
                      }

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
                    {loading
                      ? addToOrderId
                        ? "Adding to existing order..."
                        : "Placing order..."
                      : addToOrderId
                        ? "Add to existing order"
                        : "Place order"}
                  </Button>
                )}
              </div>
            </Card>

            {/* Order summary */}
            <div className="h-fit space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold">
                  Order summary
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">
                      Items (
                      {cart.reduce(
                        (sum, item) =>
                          sum + item.qty,
                        0,
                      )}
                      )
                    </span>

                    <span>
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted">
                      Delivery
                    </span>

                    <span
                      className={
                        deliveryFee === 0
                          ? "text-success"
                          : undefined
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

                      <span>
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <span>🥬</span>

                    <div>
                      <p className="font-medium">
                        Fresh groceries
                      </p>

                      <p className="text-muted">
                        Quality products for your everyday
                        needs.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span>💰</span>

                    <div>
                      <p className="font-medium">
                        Everyday low prices
                      </p>

                      <p className="text-muted">
                        Great value on your daily essentials.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span>🚚</span>

                    <div>
                      <p className="font-medium">
                        1-day delivery
                      </p>

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
                <CheckCircle2
                  size={52}
                  strokeWidth={2.2}
                />
              </div>

              <h2
                id="order-success-title"
                className="mt-5 text-2xl font-bold"
              >
                {addToOrderId
                  ? "Order updated successfully!"
                  : "Order placed successfully!"}
              </h2>

              <p className="mt-2 text-muted">
                {addToOrderId
                  ? "Your selected products have been added to your existing order."
                  : `Thank you, ${
                      user?.name?.split(" ")[0] ||
                      "there"
                    }. Your grocery order has been confirmed.`}
              </p>

              <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span>Order number</span>

                  <strong>{orderId}</strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>Delivery</span>

                  <strong>
                    Tomorrow by 8 PM
                  </strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>Payment</span>

                  <strong>
                    {paymentMethod === "cod"
    ?   "Cash on delivery"
    : paymentMethod === "card"
      ? "Credit / Debit Card"
      : paymentMethod === "upi"
        ? "UPI / Net Banking"
        : "Digital Wallet"}
                  </strong>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={`/track/${orderId}`}>
                  <Button
                    className="w-full"
                    size="lg"
                  >
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