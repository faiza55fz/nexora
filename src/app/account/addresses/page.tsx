"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";

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
};

const emptyForm = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  city: "",
  state: "Karnataka",
  pincode: "",
  is_default: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view your addresses.");
        return;
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setAddresses(data ?? []);
    } catch (error) {
      console.error("Loading addresses failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your addresses.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(address: Address) {
    setEditingId(address.id);

    setForm({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 ?? "",
      landmark: address.landmark ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: address.is_default,
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function saveAddress() {
    try {
      setSaving(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to save an address.");
        return;
      }

      if (
        !form.full_name.trim() ||
        !form.phone.trim() ||
        !form.address_line1.trim() ||
        !form.city.trim() ||
        !form.state.trim() ||
        !form.pincode.trim()
      ) {
        setError("Please fill in all required fields.");
        return;
      }

      if (!/^\d{6}$/.test(form.pincode.trim())) {
        setError("Please enter a valid 6-digit pincode.");
        return;
      }

      if (!/^\d{10}$/.test(form.phone.trim())) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      if (form.is_default) {
        const { error: defaultError } = await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", user.id);

        if (defaultError) {
          throw defaultError;
        }
      }

      const addressData = {
        label: form.label,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        landmark: form.landmark.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        is_default: form.is_default,
      };

      if (editingId) {
        const { error } = await supabase
          .from("customer_addresses")
          .update(addressData)
          .eq("id", editingId)
          .eq("customer_id", user.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("customer_addresses")
          .insert({
            customer_id: user.id,
            ...addressData,
          });

        if (error) {
          throw error;
        }
      }

      closeForm();
      await loadAddresses();
    } catch (error) {
      console.error("Saving address failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the address.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function setAsDefault(addressId: string) {
    try {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to update your address.");
        return;
      }

      const { error: resetError } = await supabase
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("customer_id", user.id);

      if (resetError) {
        throw resetError;
      }

      const { error } = await supabase
        .from("customer_addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("customer_id", user.id);

      if (error) {
        throw error;
      }

      await loadAddresses();
    } catch (error) {
      console.error("Setting default address failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to set the default address.",
      );
    }
  }

  async function deleteAddress() {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to delete an address.");
        return;
      }

      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", deleteId)
        .eq("customer_id", user.id);

      if (error) {
        throw error;
      }

      setDeleteId(null);
      await loadAddresses();
    } catch (error) {
      console.error("Deleting address failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete the address.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Back to account
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Address Book
          </h1>

          <p className="mt-1 text-sm text-muted">
            Manage your saved delivery addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
        >
          + Add new address
        </button>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-muted">
          Loading your addresses...
        </p>
      )}

      {!loading && error && !showForm && !deleteId && (
        <Card className="mt-6 p-5">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </Card>
      )}

      {!loading && !error && addresses.length === 0 && (
        <Card className="mt-6 p-8 text-center">
          <div className="text-4xl">📍</div>

          <h2 className="mt-3 font-semibold">
            No saved addresses
          </h2>

          <p className="mt-1 text-sm text-muted">
            Add an address to make checkout faster.
          </p>

          <button
            type="button"
            onClick={openAddForm}
            className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
          >
            Add your first address
          </button>
        </Card>
      )}

      {!loading && !error && addresses.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    {address.label}
                  </span>

                  {address.is_default && (
                    <span className="ml-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Default
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="font-semibold">
                  {address.full_name}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {address.phone}
                </p>

                <p className="mt-3 text-sm leading-6">
                  {address.address_line1}

                  {address.address_line2 && (
                    <>
                      <br />
                      {address.address_line2}
                    </>
                  )}

                  {address.landmark && (
                    <>
                      <br />
                      {address.landmark}
                    </>
                  )}

                  <br />
                  {address.city}, {address.state} -{" "}
                  {address.pincode}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => openEditForm(address)}
                  className="text-sm font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
                >
                  Edit
                </button>

                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => setAsDefault(address.id)}
                    className="text-sm font-semibold text-muted transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
                  >
                    Set as default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDeleteId(address.id)}
                  className="text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId
                    ? "Edit address"
                    : "Add new address"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {editingId
                    ? "Update your saved delivery address."
                    : "Save an address for faster checkout."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-xl text-muted transition-all hover:scale-110"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Address type
                </label>

                <select
                  value={form.label}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      label: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Full name *
                </label>

                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Enter your name"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Phone number *
                </label>

                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    })
                  }
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Address *
                </label>

                <input
                  value={form.address_line1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address_line1: e.target.value,
                    })
                  }
                  placeholder="House / flat / street"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Address line 2
                </label>

                <input
                  value={form.address_line2}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address_line2: e.target.value,
                    })
                  }
                  placeholder="Area / locality"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Landmark
                </label>

                <input
                  value={form.landmark}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      landmark: e.target.value,
                    })
                  }
                  placeholder="Nearby landmark"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    City *
                  </label>

                  <input
                    value={form.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city: e.target.value,
                      })
                    }
                    placeholder="City"
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    State *
                  </label>

                  <input
                    value={form.state}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        state: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Pincode *
                </label>

                <input
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pincode: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    })
                  }
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_default: e.target.checked,
                    })
                  }
                />

                Set as default address
              </label>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={saving}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Save address"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              Delete address?
            </h2>

            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete this saved address?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep address
              </button>

              <button
                type="button"
                onClick={deleteAddress}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}