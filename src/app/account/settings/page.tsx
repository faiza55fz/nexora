"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";
import { supabase } from "@/lib/supabase";
import { Badge, Button, Card } from "@/components/ui";

type Preferences = {
  in_app: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
  order_updates: boolean;
  delivery_updates: boolean;
  back_in_stock: boolean;
  offers_promotions: boolean;
};

const defaultPreferences: Preferences = {
  in_app: true,
  push: true,
  email: true,
  sms: false,
  order_updates: true,
  delivery_updates: true,
  back_in_stock: true,
  offers_promotions: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, authReady, theme, toggleTheme, logout } = useStore();

  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);

  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);
  const [savedKey, setSavedKey] = useState<keyof Preferences | null>(null);

  useEffect(() => {
    const customerId = user?.id;
    if (!user?.id) return;

    async function loadPreferences() {
      setLoadingPreferences(true);

      const { data, error } = await supabase
        .from("customer_notification_preferences")
        .select(`
          in_app,
          push,
          email,
          sms,
          order_updates,
          delivery_updates,
          back_in_stock,
          offers_promotions
        `)
        .eq("customer_id", customerId)
        .maybeSingle();

      if (error) {
        console.error(
          "Failed to load notification preferences:",
          error,
        );
        setLoadingPreferences(false);
        return;
      }

      if (data) {
        setPreferences({
          in_app: data.in_app,
          push: data.push,
          email: data.email,
          sms: data.sms,
          order_updates: data.order_updates,
          delivery_updates: data.delivery_updates,
          back_in_stock: data.back_in_stock,
          offers_promotions: data.offers_promotions,
        });
      } else {
        const { error: insertError } = await supabase
          .from("customer_notification_preferences")
          .insert({
            customer_id: customerId,
            ...defaultPreferences,
          });

        if (insertError) {
          console.error(
            "Failed to create notification preferences:",
            insertError,
          );
        }
      }

      setLoadingPreferences(false);
    }

    void loadPreferences();
  }, [user?.id]);

  async function updatePreference(
    key: keyof Preferences,
  ) {
    if (!user?.id || savingKey) return;

    const nextValue = !preferences[key];

    setPreferences((current) => ({
      ...current,
      [key]: nextValue,
    }));

    setSavingKey(key);
    setSavedKey(null);

    const { error } = await supabase
      .from("customer_notification_preferences")
      .update({
        [key]: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", user.id);

    if (error) {
      console.error(
        "Failed to save notification preference:",
        error,
      );

      setPreferences((current) => ({
        ...current,
        [key]: !nextValue,
      }));

      setSavingKey(null);
      return;
    }

    setSavingKey(null);
    setSavedKey(key);

    window.setTimeout(() => {
      setSavedKey((current) =>
        current === key ? null : current,
      );
    }, 1500);
  }

  function PreferenceRow({
    preferenceKey,
    title,
    description,
  }: {
    preferenceKey: keyof Preferences;
    title: string;
    description: string;
  }) {
    const enabled = preferences[preferenceKey];
    const saving = savingKey === preferenceKey;
    const saved = savedKey === preferenceKey;

    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
        <div className="min-w-0">
          <p className="font-medium">{title}</p>

          <p className="mt-1 text-xs text-muted">
            {description}
          </p>

          {saved && (
            <p className="mt-1 text-xs text-brand">
              Saved
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => updatePreference(preferenceKey)}
          disabled={loadingPreferences || saving}
          aria-label={`Turn ${enabled ? "off" : "on"} ${title}`}
          aria-pressed={enabled}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            enabled
              ? "bg-brand"
              : "bg-muted/30"
          } ${
            saving
              ? "cursor-wait opacity-60"
              : "cursor-pointer"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
              enabled
                ? "left-6"
                : "left-1"
            }`}
          />
        </button>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold">
            Login required
          </h1>

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Back
      </button>

      <div>
        <h1 className="text-2xl font-semibold">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted">
          Manage your preferences and account settings.
        </p>
      </div>

      {/* Appearance */}
      <Card className="mt-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Appearance
          </h2>

          <p className="mt-1 text-sm text-muted">
            Choose how Nexora looks on your device.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (theme === "dark") {
                toggleTheme();
              }
            }}
            className={`rounded-xl border p-4 text-left transition ${
              theme === "light"
                ? "border-brand bg-brand/5"
                : "border-border hover:bg-surface-2"
            }`}
          >
            <p className="font-semibold">
              ☀️ Light
            </p>

            <p className="mt-1 text-sm text-muted">
              Use a bright appearance.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme === "light") {
                toggleTheme();
              }
            }}
            className={`rounded-xl border p-4 text-left transition ${
              theme === "dark"
                ? "border-brand bg-brand/5"
                : "border-border hover:bg-surface-2"
            }`}
          >
            <p className="font-semibold">
              🌙 Dark
            </p>

            <p className="mt-1 text-sm text-muted">
              Use a darker appearance.
            </p>
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="mt-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Notification Preferences
          </h2>

          <p className="mt-1 text-sm text-muted">
            Choose how and when Nexora can notify you.
          </p>
        </div>

        <div className="mt-5 space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold">
              Notification channels
            </p>

            <div className="space-y-3">
              <PreferenceRow
                preferenceKey="in_app"
                title="In-app notifications"
                description="Receive notifications inside Nexora."
              />

              <PreferenceRow
                preferenceKey="push"
                title="Push notifications"
                description="Receive notifications on your device."
              />

              <PreferenceRow
                preferenceKey="email"
                title="Email notifications"
                description="Receive important updates by email."
              />

              <PreferenceRow
                preferenceKey="sms"
                title="SMS notifications"
                description="Receive important updates by SMS."
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">
              What you receive
            </p>

            <div className="space-y-3">
              <PreferenceRow
                preferenceKey="order_updates"
                title="Order updates"
                description="Updates about your orders."
              />

              <PreferenceRow
                preferenceKey="delivery_updates"
                title="Delivery updates"
                description="Updates about delivery status."
              />

              <PreferenceRow
                preferenceKey="back_in_stock"
                title="Back-in-stock alerts"
                description="Know when unavailable products are available again."
              />

              <PreferenceRow
                preferenceKey="offers_promotions"
                title="Offers & promotions"
                description="Receive deals and promotional updates."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Payments */}
      <Card className="mt-5 p-6">
        <h2 className="text-lg font-semibold">
          Payments
        </h2>

        <p className="mt-1 text-sm text-muted">
          Manage your available payment options.
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">UPI</p>

              <p className="mt-1 text-xs text-muted">
                Pay securely using UPI during checkout.
              </p>
            </div>

            <Badge tone="success">
              Available
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">
                Cash on Delivery
              </p>

              <p className="mt-1 text-xs text-muted">
                Pay when your order is delivered.
              </p>
            </div>

            <Badge tone="success">
              Available
            </Badge>
          </div>
        </div>
      </Card>

      {/* Account & Privacy */}
      <Card className="mt-5 p-6">
        <h2 className="text-lg font-semibold">
          Account & Privacy
        </h2>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            Personal information
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/account/addresses")
            }
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            Address Book
          </button>

          <button
            type="button"
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            Change password
          </button>

          <button
            type="button"
            className="w-full rounded-xl p-3 text-left font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Delete account
          </button>
        </div>
      </Card>

      {/* Help */}
      <Card className="mt-5 p-6">
        <h2 className="text-lg font-semibold">
          Help & Support
        </h2>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => router.push("/faq")}
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            FAQs & Help
          </button>

          <button
            type="button"
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            Contact Nexora
          </button>
        </div>
      </Card>

      {/* About */}
      <Card className="mt-5 p-6">
        <h2 className="text-lg font-semibold">
          About Nexora
        </h2>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            About Nexora
          </button>

          <button
            type="button"
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            Terms & Conditions
          </button>

          <button
            type="button"
            className="w-full rounded-xl p-3 text-left font-medium hover:bg-surface-2"
          >
            Privacy Policy
          </button>
        </div>
      </Card>

      {/* Logout */}
      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          onClick={logout}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}