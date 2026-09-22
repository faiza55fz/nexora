"use client";

import { useEffect, useState } from "react";
import { products } from "@/lib/data";
import {
  Button,
  Card,
  PageHeader,
  Field,
  Input,
} from "@/components/ui";
import { inr } from "@/lib/format";

type Product = (typeof products)[number] & {
  active?: boolean;
};

const emptyProduct: Product = {
  id: "",
  slug: "",
  name: "",
  brand: "",
  category: "fruits",
  subcategory: "",
  image: "",
  images: [],
  mrp: 0,
  price: 0,
  gstRate: 0,
  rating: 0,
  reviewCount: 0,
  sold: 0,
  sellerId: "s1",
  stock: 0,
  deliveryEta: "Tomorrow",
  location: "",
  tags: [],
  highlights: [],
  description: "",
  specs: {},
  moq: 1,
  tiers: [],
  active: true,
};

export default function AdminCatalog() {
  const [catalogProducts, setCatalogProducts] =
    useState<Product[]>(products);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

useEffect(() => {
  async function loadProducts() {
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load products");
      }

      const mappedProducts: Product[] = result.products.map(
        (product: any) => {
          const variant = product.product_variants?.[0];
          const inventory = variant?.inventory;

          return {
            ...emptyProduct,
            id: product.id,
            name: product.name,
            brand: product.brand || "",
            category:
              product.categories?.name?.toLowerCase() || "fruits",
            subcategory: product.subcategory || "",
            description: product.description || "",
            active: product.active !== false,
            rating: Number(product.rating || 0),
            reviewCount: Number(product.review_count || 0),

            mrp: Number(variant?.mrp || 0),
            price: Number(variant?.selling_price || 0),
            gstRate: Number(variant?.gst_rate || 0),

            stock: Number(inventory?.stock_quantity || 0),

            specs: {
              Unit: variant?.variant_name || "",
            },

            image: product.product_images?.find(
              (image: any) => image.is_primary,
            )?.image_url || "",

            images:
              product.product_images?.map(
                (image: any) => image.image_url,
              ) || [],
          };
        },
      );

      setCatalogProducts(mappedProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }

  loadProducts();
}, []);


async function saveProduct(updatedProduct: Product) {
  try {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: updatedProduct.id,
        name: updatedProduct.name,
        brand: updatedProduct.brand,
        category: updatedProduct.category,
        subcategory: updatedProduct.subcategory,
        description: updatedProduct.description,
        price: updatedProduct.price,
        mrp: updatedProduct.mrp,
        gstRate: updatedProduct.gstRate,
        stock: updatedProduct.stock,
        unit: updatedProduct.specs?.Unit || "",
        active: updatedProduct.active !== false,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || result.error || "Failed to update product",
      );
    }

    // Update Admin UI
    setCatalogProducts((current) =>
      current.map((product) =>
        product.id === updatedProduct.id
          ? updatedProduct
          : product,
      ),
    );

    // Keep the current customer-side localStorage data
    // in sync until customer products are fully moved to Supabase.
    const savedProducts = catalogProducts.map((product) =>
      product.id === updatedProduct.id
        ? updatedProduct
        : product,
    );

    localStorage.setItem(
      "nexora-admin-products",
      JSON.stringify(savedProducts),
    );

    setSelectedProduct(updatedProduct);
    setEditing(false);
  } catch (error) {
    console.error("Failed to save product:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to save product",
    );
  }
}

  /*
   * Toggle active/inactive status.
   * The catalog state is the single source of truth.
   */
async function toggleProductStatus(productId: string) {
  const currentProduct = catalogProducts.find(
    (product) => product.id === productId,
  );

  if (!currentProduct) return;

  const nextStatus = currentProduct.active === false;

  try {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: productId,
        active: nextStatus,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          result.error ||
          "Failed to update product status",
      );
    }

    const updatedProduct: Product = {
      ...currentProduct,
      active: nextStatus,
    };

    setCatalogProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? updatedProduct
          : product,
      ),
    );

    setSelectedProduct(updatedProduct);
  } catch (error) {
    console.error(
      "Failed to update product status:",
      error,
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to update product status",
    );
  }
}

async function addProduct(newProduct: Product) {
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: newProduct.id,
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        subcategory: newProduct.subcategory,
        description: newProduct.description,
        price: newProduct.price,
        mrp: newProduct.mrp,
        gstRate: newProduct.gstRate,
        stock: newProduct.stock,
        unit: newProduct.specs?.Unit || "",
        image: newProduct.image || "",
        active: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          result.error ||
          "Failed to add product",
      );
    }

    const addedProduct: Product = {
      ...newProduct,
      active: true,
    };

    setCatalogProducts((current) => [
      ...current,
      addedProduct,
    ]);

    setAdding(false);
  } catch (error) {
    console.error(
      "Failed to add product:",
      error,
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to add product",
    );
  }
}

  const activeCount = catalogProducts.filter(
    (product) => product.active !== false,
  ).length;

  const inactiveCount =
    catalogProducts.length - activeCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage grocery listings, pricing and stock."
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">
            Total products
          </p>

          <p className="mt-2 text-2xl font-bold">
            {catalogProducts.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Active listings
          </p>

          <p className="mt-2 text-2xl font-bold text-brand">
            {activeCount}
          </p>

          {inactiveCount > 0 && (
            <p className="mt-1 text-xs text-muted">
              {inactiveCount} inactive
            </p>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Categories
          </p>

          <p className="mt-2 text-2xl font-bold">
            {
              new Set(
                catalogProducts.map(
                  (product) => product.category,
                ),
              ).size
            }
          </p>
        </Card>
      </div>

      {/* Product table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h2 className="font-semibold">
              All products
            </h2>

            <p className="mt-1 text-xs text-muted">
              Review and manage your grocery catalog.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setAdding(true);
              setSelectedProduct(null);
            }}
          >
            + Add product
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="p-4 font-semibold">
                  Product
                </th>

                <th className="p-4 font-semibold">
                  Category
                </th>

                <th className="p-4 font-semibold">
                  Price
                </th>

                <th className="p-4 font-semibold">
                  Stock
                </th>

                <th className="p-4 font-semibold">
                  Status
                </th>

                <th className="p-4 font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {catalogProducts.map((product) => {
                const isActive =
                  product.active !== false;

                return (
                  <tr
                    key={product.id}
                    className="border-t border-line"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {product.brand}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-muted">
                      {product.category}
                    </td>

                    <td className="p-4 font-semibold">
                      {inr(product.price)}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          product.stock <= 10
                            ? "font-semibold text-red-600"
                            : "font-medium"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          isActive
                            ? "rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
                            : "rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted"
                        }
                      >
                        {isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setEditing(false);
                          setAdding(false);
                        }}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit / Review modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          editing={editing}
          onClose={() => {
            setSelectedProduct(null);
            setEditing(false);
          }}
          onEdit={() => setEditing(true)}
          onSave={saveProduct}
          onToggleStatus={toggleProductStatus}
        />
      )}

      {/* Add product modal */}
      {adding && (
        <AddProductModal
          onClose={() => setAdding(false)}
          onSave={addProduct}
        />
      )}
    </div>
  );
}

/* --------------------------------
   EDIT / REVIEW MODAL
--------------------------------- */

function ProductModal({
  product,
  editing,
  onClose,
  onEdit,
  onSave,
  onToggleStatus,
}: {
  product: Product;
  editing: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: (product: Product) => void;
  onToggleStatus: (productId: string) => void;
}) {
  const [form, setForm] =
    useState<Product>(product);

  useEffect(() => {
    setForm(product);
  }, [product]);

  function updateField<K extends keyof Product>(
    field: K,
    value: Product[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleToggleStatus() {
    onToggleStatus(product.id);
  }

  const isActive = form.active !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {editing
                ? "Edit product"
                : "Product review"}
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {form.name}
            </h2>

            {!editing && (
              <span
                className={
                  isActive
                    ? "mt-2 inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
                    : "mt-2 inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted"
                }
              >
                {isActive
                  ? "Active listing"
                  : "Inactive listing"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-muted hover:bg-surface-2"
          >
            ×
          </button>
        </div>

        {!editing ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info
                label="Brand"
                value={form.brand}
              />

              <Info
                label="Category"
                value={form.category}
              />

              <Info
                label="Price"
                value={inr(form.price)}
              />

              <Info
                label="MRP"
                value={inr(form.mrp)}
              />

              <Info
                label="Stock"
                value={`${form.stock} units`}
              />

              <Info
                label="GST"
                value={`${form.gstRate}%`}
              />

              <Info
                label="Delivery"
                value={form.deliveryEta}
              />

              <Info
                label="Product ID"
                value={form.id}
              />
            </div>

            <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-xs text-muted">
                Description
              </p>

              <p className="mt-1 text-sm">
                {form.description}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={handleToggleStatus}
              >
                {isActive
                  ? "Deactivate product"
                  : "Reactivate product"}
              </Button>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>

                <Button onClick={onEdit}>
                  Edit product
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Product name">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Brand">
                <Input
                  value={form.brand}
                  onChange={(e) =>
                    updateField(
                      "brand",
                      e.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Category">
                <Input
                  value={form.category}
                  onChange={(e) =>
                    updateField(
                      "category",
                      e.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Price">
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    updateField(
                      "price",
                      Number(e.target.value),
                    )
                  }
                />
              </Field>

              <Field label="MRP">
                <Input
                  type="number"
                  min="0"
                  value={form.mrp}
                  onChange={(e) =>
                    updateField(
                      "mrp",
                      Number(e.target.value),
                    )
                  }
                />
              </Field>

              <Field label="Stock">
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    updateField(
                      "stock",
                      Number(e.target.value),
                    )
                  }
                />
              </Field>

              <Field label="GST rate (%)">
                <Input
                  type="number"
                  min="0"
                  value={form.gstRate}
                  onChange={(e) =>
                    updateField(
                      "gstRate",
                      Number(e.target.value),
                    )
                  }
                />
              </Field>

              <Field label="Delivery ETA">
                <Input
                  value={form.deliveryEta}
                  onChange={(e) =>
                    updateField(
                      "deliveryEta",
                      e.target.value,
                    )
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value,
                    )
                  }
                  rows={4}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-brand"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setForm(product);
                  onClose();
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={() => onSave(form)}
              >
                Save changes
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* --------------------------------
   ADD PRODUCT MODAL
--------------------------------- */

function AddProductModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [form, setForm] =
    useState<Product>(emptyProduct);

  function updateField<K extends keyof Product>(
    field: K,
    value: Product[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submit() {
    if (
      !form.name.trim() ||
      !form.brand.trim() ||
      form.price <= 0 ||
      form.mrp <= 0
    ) {
      return;
    }

    const id = `p${Date.now()}`;

    const slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const defaultImage =
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80";

    const newProduct: Product = {
      ...form,
      id,
      slug,
      active: true,
      image: form.image || defaultImage,
      images: [
        form.image || defaultImage,
      ],
      tiers: [
        {
          minQty: 1,
          price: form.price,
        },
      ],
    };

    onSave(newProduct);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              New listing
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Add product
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-muted hover:bg-surface-2"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Product name">
            <Input
              value={form.name}
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value,
                )
              }
              placeholder="e.g. Fresh Mangoes"
            />
          </Field>

          <Field label="Brand">
            <Input
              value={form.brand}
              onChange={(e) =>
                updateField(
                  "brand",
                  e.target.value,
                )
              }
              placeholder="e.g. Fresh Basket"
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) =>
                updateField(
                  "category",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="fruits">
                Fruits
              </option>

              <option value="vegetables">
                Vegetables
              </option>

              <option value="dairy">
                Dairy & Eggs
              </option>

              <option value="staples">
                Rice, Atta & Grains
              </option>

              <option value="pulses">
                Pulses
              </option>

              <option value="spices">
                Masala & Spices
              </option>

              <option value="snacks">
                Snacks
              </option>

              <option value="beverages">
                Beverages
              </option>

              <option value="household">
                Household
              </option>
            </select>
          </Field>

          <Field label="Price">
            <Input
              type="number"
              min="0"
              value={form.price || ""}
              onChange={(e) =>
                updateField(
                  "price",
                  Number(e.target.value),
                )
              }
              placeholder="Selling price"
            />
          </Field>

          <Field label="MRP">
            <Input
              type="number"
              min="0"
              value={form.mrp || ""}
              onChange={(e) =>
                updateField(
                  "mrp",
                  Number(e.target.value),
                )
              }
              placeholder="Maximum retail price"
            />
          </Field>

          <Field label="Stock">
            <Input
              type="number"
              min="0"
              value={form.stock || ""}
              onChange={(e) =>
                updateField(
                  "stock",
                  Number(e.target.value),
                )
              }
              placeholder="Available quantity"
            />
          </Field>

          <Field label="GST rate (%)">
            <Input
              type="number"
              min="0"
              value={form.gstRate}
              onChange={(e) =>
                updateField(
                  "gstRate",
                  Number(e.target.value),
                )
              }
            />
          </Field>

          <Field label="Delivery ETA">
            <Input
              value={form.deliveryEta}
              onChange={(e) =>
                updateField(
                  "deliveryEta",
                  e.target.value,
                )
              }
              placeholder="e.g. Tomorrow by 12 PM"
            />
          </Field>

          <Field label="Unit">
            <Input
              value={form.specs.Unit || ""}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  specs: {
                    ...current.specs,
                    Unit: e.target.value,
                  },
                }))
              }
              placeholder="e.g. 1 kg"
            />
          </Field>

          <Field label="Image URL">
            <Input
              value={form.image}
              onChange={(e) =>
                updateField(
                  "image",
                  e.target.value,
                )
              }
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value,
                )
              }
              rows={4}
              placeholder="Describe the product..."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-brand"
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button onClick={submit}>
            Add product
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------
   INFO CARD
--------------------------------- */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-xs text-muted">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}