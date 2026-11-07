"use client";

import { useEffect, useState, useRef } from "react";
import { products } from "@/lib/data";
import JsBarcode from "jsbarcode";

import {
  Button,
  Card,
  PageHeader,
  Field,
  Input,
} from "@/components/ui";
import { inr } from "@/lib/format";

type ProductVariant = {
  id: string;
  sku: string;
  barcode: string | null;
  variant_name: string;
  mrp: number;
  selling_price: number;
  stock: number;
};


function BarcodeImage({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 12,
      margin: 8,
    });
  }, [value]);

  function downloadBarcode() {
    if (!svgRef.current) return;

    const svg = new XMLSerializer().serializeToString(
      svgRef.current,
    );

    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${value}-barcode.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function printBarcode() {
    if (!svgRef.current) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=600,height=400",
    );

    if (!printWindow) {
      alert("Please allow pop-ups to print the barcode.");
      return;
    }

    const svg = new XMLSerializer().serializeToString(
      svgRef.current,
    );

    const imageUrl =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${value}</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { min-height: auto; }
            }
          </style>
        </head>
        <body>
          <img
            src="${imageUrl}"
            onload="window.print()"
          />
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  
  return (
    <div>
      <div className="rounded-lg bg-white p-2">
        <svg
          ref={svgRef}
          className="block max-w-full"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadBarcode}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2"
        >
          
          Download barcode
        </button>

        <button
          type="button"
          onClick={printBarcode}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Print barcode
        </button>
      </div>
    </div>
  );

}

type ProductImage = {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
};

type Product = (typeof products)[number] & {
  active?: boolean;
  moderation_status?: "pending" | "approved" | "rejected";
  variants?: ProductVariant[];
  productImages?: ProductImage[];
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
  moderation_status: "pending",
};

export default function AdminCatalog() {
  const [catalogProducts, setCatalogProducts] =
    useState<Product[]>(products);

    const [searchQuery, setSearchQuery] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products?admin=true", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load products",
          );
        }

        const mappedProducts: Product[] = result.products.map(
          (product: any) => {
            const variant = product.product_variants?.[0];
            const inventory = variant?.inventory;

            return {
              ...emptyProduct,
              id: product.id,
              variants: (product.product_variants || []).map(
  (variant: any) => ({
    id: variant.id,
    sku: variant.sku,
    barcode: variant.barcode || null,
    variant_name: variant.variant_name || variant.unit || "",
    mrp: Number(variant.mrp || 0),
    selling_price: Number(variant.selling_price || 0),
    stock: Number(
      variant.inventory?.stock_quantity || 0,
    ),
  }),
),
              name: product.name,
              brand: product.brand || "",
              category:
                product.categories?.name?.toLowerCase() ||
                "fruits",
              subcategory: product.subcategory || "",
              description: product.description || "",
              active: product.active !== false,
              moderation_status:
                product.moderation_status || "approved",
              rating: Number(product.rating || 0),
              reviewCount: Number(
                product.review_count || 0,
              ),

              mrp: Number(variant?.mrp || 0),
              price: Number(
                variant?.selling_price || 0,
              ),
              gstRate: Number(
                variant?.gst_rate || 0,
              ),

              stock: Number(
                inventory?.stock_quantity || 0,
              ),

              specs: {
                Unit: variant?.variant_name || "",
              },

              productImages: (product.product_images || [])
                .map((image: any) => ({
                  id: image.id,
                  image_url: image.image_url,
                  display_order: image.display_order,
                  is_primary: image.is_primary,
                }))
                .sort(
                  (a: ProductImage, b: ProductImage) =>
                    a.display_order - b.display_order,
                ),
             image:
                product.product_images?.find(
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
        console.error(
          "Failed to load products:",
          error,
        );
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
          result.message ||
            result.error ||
            "Failed to update product",
        );
      }

      setCatalogProducts((current) =>
        current.map((product) =>
          product.id === updatedProduct.id
            ? updatedProduct
            : product,
        ),
      );

      const savedProducts = catalogProducts.map(
        (product) =>
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
      console.error(
        "Failed to save product:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save product",
      );
    }
  }

  async function toggleProductStatus(
    productId: string,
  ) {
    const currentProduct = catalogProducts.find(
      (product) => product.id === productId,
    );

    if (!currentProduct) return;

    const nextStatus =
      currentProduct.active === false;

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

  const updateModerationStatus = async (
    product: Product,
    moderation_status:
      | "approved"
      | "rejected",
  ) => {
    try {
      const response = await fetch(
        "/api/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: product.id,
            moderation_status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
  console.log("Moderation API error:", data);
  throw new Error(
    data.error ||
    data.message ||
    "Failed to update moderation status",
  );
}

      const updatedProduct: Product = {
        ...product,
        moderation_status,
      };

      setCatalogProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? updatedProduct
            : item,
        ),
      );

      setSelectedProduct(updatedProduct);
    } catch (error) {
      console.error(
        "Failed to update moderation status:",
        error,
      );

      alert(
        "Failed to update moderation status",
      );
    }
  };

  async function addProduct(
    newProduct: Product,
  ) {
    try {
      const response = await fetch(
        "/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newProduct.id,
            name: newProduct.name,
            brand: newProduct.brand,
            category: newProduct.category,
            subcategory:
              newProduct.subcategory,
            description:
              newProduct.description,
            price: newProduct.price,
            mrp: newProduct.mrp,
            gstRate: newProduct.gstRate,
            stock: newProduct.stock,
            unit:
              newProduct.specs?.Unit || "",
            image: newProduct.image || "",
            active: true,
          }),
        },
      );

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
        moderation_status: "pending",
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

    const filteredProducts = catalogProducts.filter((product) => {
  const query = searchQuery.trim().toLowerCase();

  if (!query) return true;

  const searchableValues = [
    product.name,
    product.brand,
    product.category,
    product.subcategory,
    ...(product.variants || []).flatMap((variant) => [
      variant.sku,
      variant.barcode || "",
      variant.variant_name,
    ]),
  ];

  return searchableValues.some((value) =>
    String(value || "").toLowerCase().includes(query)
  );
});

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
                  (product) =>
                    product.category,
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

        <div className="border-b border-line p-4">
  <Input
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search by product name, brand, category, SKU or barcode..."
  />

  <p className="mt-2 text-xs text-muted">
    Showing {filteredProducts.length} of {catalogProducts.length} products
  </p>
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
                  Moderation
                </th>

                <th className="p-4 font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 && (
  <tr>
    <td
      colSpan={7}
      className="p-8 text-center text-sm text-muted"
    >
      No products found. Try another keyword.
    </td>
  </tr>
)}
              {filteredProducts.map(
                (product) => {
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
                            SUNDAYSHOP
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
                        <span
                          className={
                            product.moderation_status ===
                            "approved"
                              ? "rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                              : product.moderation_status ===
                                  "rejected"
                                ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
                                : "rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning"
                          }
                        >
                          {product.moderation_status ===
                          "approved"
                            ? "Approved"
                            : product.moderation_status ===
                                "rejected"
                              ? "Rejected"
                              : "Pending"}
                        </span>
                      </td>

                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(
                              product,
                            );
                            setEditing(false);
                            setAdding(false);
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                },
              )}
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
          onToggleStatus={
            toggleProductStatus
          }
          onUpdateModeration={
            updateModerationStatus
          }
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
  onUpdateModeration,
}: {
  product: Product;
  editing: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: (product: Product) => void;
  onToggleStatus: (
    productId: string,
  ) => void;
  onUpdateModeration: (
    product: Product,
    moderation_status:
      | "approved"
      | "rejected",
  ) => void;
}) {
  const [form, setForm] =
    useState<Product>(product);
    type PixabayImage = {
  id: number;
  preview: string;
  image: string;
  tags: string;
  photographer: string;
  source: string;
};

const [showImageEditor, setShowImageEditor] = useState(false);
const [showAddImageEditor, setShowAddImageEditor] = useState(false);
const [imageResults, setImageResults] = useState<PixabayImage[]>([]);
const [selectedImage, setSelectedImage] = useState("");
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [searchingImages, setSearchingImages] = useState(false);
const [savingImage, setSavingImage] = useState(false);
const [imageError, setImageError] = useState("");

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
  async function searchExistingProductImages() {
  setSearchingImages(true);
  setImageError("");
  setImageResults([]);

  try {
    const query = `${form.name} ${form.brand}`.trim();

    const response = await fetch(
      `/api/products/image-search?q=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image search failed");
    }

    setImageResults(data.images || []);

    if (!data.images?.length) {
      setImageError("No images found.");
    }
  } catch (error) {
    setImageError(
      error instanceof Error ? error.message : "Image search failed"
    );
  } finally {
    setSearchingImages(false);
  }
}

async function saveReplacementImage() {
  if (!selectedImage && !selectedFile) return;

  setSavingImage(true);
  setImageError("");

  try {
    let response: Response;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      response = await fetch(
        `/api/products/${product.id}/image`,
        {
          method: "POST",
          body: formData,
        }
      );
    } else {
      response = await fetch(
        `/api/products/${product.id}/image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceUrl: selectedImage,
          }),
        }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image replacement failed");
    }

    setForm((current) => ({
      ...current,
      image: data.imageUrl,
      images: [data.imageUrl],
       productImages: data.images || current.productImages,
    }));

    setSelectedImage("");
    setSelectedFile(null);
    setImageResults([]);
    setShowImageEditor(false);

  } catch (error) {
    setImageError(
      error instanceof Error ? error.message : "Image replacement failed"
    );
  } finally {
    setSavingImage(false);
  }
}

async function saveAdditionalImage() {
  if (!selectedImage && !selectedFile) return;

  setSavingImage(true);
  setImageError("");

  try {
    let response: Response;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("action", "add");

      response = await fetch(
        `/api/products/${product.id}/image`,
        {
          method: "POST",
          body: formData,
        }
      );
    } else {
      response = await fetch(
        `/api/products/${product.id}/image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceUrl: selectedImage,
            action: "add",
          }),
        }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not add image");
    }

    setForm((current) => ({
      ...current,
      images: (data.images || []).map(
        (image: ProductImage) => image.image_url
      ),
      productImages: data.images || current.productImages,
      image: current.image || data.imageUrl,
    }));

    setSelectedImage("");
    setSelectedFile(null);
    setImageResults([]);
    setShowAddImageEditor(false);

  } catch (error) {
    setImageError(
      error instanceof Error ? error.message : "Could not add image"
    );
  } finally {
    setSavingImage(false);
  }
}

  const isActive = form.active !== false;

  const moderationStatus =
    form.moderation_status || "pending";

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
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={
                    isActive
                      ? "inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
                      : "inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted"
                  }
                >
                  {isActive
                    ? "Active listing"
                    : "Inactive listing"}
                </span>

                <span
                  className={
                    moderationStatus ===
                    "approved"
                      ? "inline-flex rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                      : moderationStatus ===
                          "rejected"
                        ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
                        : "inline-flex rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning"
                  }
                >
                  {moderationStatus ===
                  "approved"
                    ? "Approved"
                    : moderationStatus ===
                        "rejected"
                      ? "Rejected"
                      : "Pending"}
                </span>
              </div>
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

                {/* Existing Product Image */}
        <div className="mt-6 rounded-xl border border-line p-4">
          <h3 className="font-semibold">
            Product Image
          </h3>
          <div className="mt-4">
  <div className="mb-3 flex items-center justify-between">
    <p className="text-sm font-medium">
      Product gallery
    </p>

    <span className="text-xs text-muted">
      {form.productImages?.length || (form.image ? 1 : 0)} / 5 images
    </span>
  </div>

  <div className="flex flex-wrap gap-3">
    {form.productImages?.length ? (
      form.productImages
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((image) => (
          <div key={image.id} className="relative">
            <img
              src={image.image_url}
              alt={form.name}
              className="h-20 w-20 rounded-lg border border-line object-cover"
            />

            {image.is_primary && (
              <span className="absolute bottom-1 left-1 rounded bg-teal-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                Main
              </span>
            )}
          </div>
        ))
    ) : form.image ? (
      <img
        src={form.image}
        alt={form.name}
        className="h-20 w-20 rounded-lg border border-line object-cover"
      />
    ) : null}
  </div>
</div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {form.image ? (
              <img
                src={form.image}
                alt={form.name}
                className="h-28 w-28 rounded-xl border border-line object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-surface-2 text-xs text-muted">
                No image
              </div>
            )}

            <div>
              <p className="text-sm font-medium">
                {form.name}
              </p>

              <button
                type="button"
                onClick={() => setShowImageEditor((value) => !value)}
                className="mt-2 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-2"
              >
                {showImageEditor ? "Cancel image change" : "Change Image"}
              </button>

              <button
  type="button"
  disabled={(form.productImages?.length || (form.image ? 1 : 0)) >= 5}
  onClick={() => {
    setShowAddImageEditor((value) => !value);
    setSelectedImage("");
    setSelectedFile(null);
    setImageResults([]);
    setImageError("");
  }}
  className="mt-2 rounded-lg border border-teal-700 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
>
  {showAddImageEditor ? "Cancel adding image" : "+ Add Another Image"}
</button>
            </div>
          </div>

          {showImageEditor && (
            <div className="mt-5 space-y-4 border-t border-line pt-4">
              <p className="text-sm font-medium">
                Find a replacement image
              </p>

              <button
                type="button"
                onClick={searchExistingProductImages}
                disabled={searchingImages}
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
              >
                {searchingImages ? "Searching..." : "Search Pixabay"}
              </button>

              {imageResults.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {imageResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setSelectedImage(item.image);
                        setSelectedFile(null);
                        setImageError("");
                      }}
                      className={`overflow-hidden rounded-xl border-2 ${
                        selectedImage === item.image
                          ? "border-brand ring-2 ring-brand/20"
                          : "border-line"
                      }`}
                    >
                      <img
                        src={item.preview}
                        alt={item.tags || form.name}
                        className="h-24 w-full object-cover"
                      />
                      <span className="block truncate p-1 text-xs">
                        {selectedImage === item.image
                          ? "✓ Selected"
                          : item.tags}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div>
  <p className="mb-3 text-sm font-medium">
    Or upload your own image
  </p>

  <label
    htmlFor="existing-product-image-upload"
    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-900"
  >
    {selectedFile ? "Change Selected Image" : "Upload Your Image"}

    <input
      id="existing-product-image-upload"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0] || null;

        setSelectedFile(file);
        setSelectedImage("");
        setImageError("");

        e.currentTarget.value = "";
      }}
    />
  </label>

  {selectedFile && (
    <p className="mt-2 text-xs text-muted">
      Selected: {selectedFile.name}
    </p>
  )}
</div>

              {imageError && (
                <p className="text-sm text-red-500">
                  {imageError}
                </p>
              )}

              <button
                type="button"
                onClick={saveReplacementImage}
                disabled={savingImage || (!selectedImage && !selectedFile)}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingImage ? "Saving image..." : "Save New Image"}
                           </button>
            </div>
          )}

          {/* Add Additional Image Editor */}
          {showAddImageEditor && (
            <div className="mt-5 space-y-4 border-t border-line pt-4">
              <p className="text-sm font-medium">
                Add an additional product image
              </p>

              <button
                type="button"
                onClick={searchExistingProductImages}
                disabled={searchingImages}
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
              >
                {searchingImages ? "Searching..." : "Search Pixabay"}
              </button>

              {imageResults.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {imageResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setSelectedImage(item.image);
                        setSelectedFile(null);
                        setImageError("");
                      }}
                      className={`overflow-hidden rounded-xl border-2 ${
                        selectedImage === item.image
                          ? "border-brand ring-2 ring-brand/20"
                          : "border-line"
                      }`}
                    >
                      <img
                        src={item.preview}
                        alt={item.tags || form.name}
                        className="h-24 w-full object-cover"
                      />
                      <span className="block truncate p-1 text-xs">
                        {selectedImage === item.image
                          ? "✓ Selected"
                          : item.tags}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-3 text-sm font-medium">
                  Or upload your own image
                </p>

                <label
                  htmlFor="additional-product-image-upload"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-900"
                >
                  {selectedFile ? "Change Selected Image" : "Upload Your Image"}

                  <input
                    id="additional-product-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                      setSelectedImage("");
                      setImageError("");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {selectedFile && (
                  <p className="mt-2 text-xs text-muted">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {imageError && (
                <p className="text-sm text-red-500">
                  {imageError}
                </p>
              )}

              <button
                type="button"
                onClick={saveAdditionalImage}
                disabled={savingImage || (!selectedImage && !selectedFile)}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingImage ? "Saving image..." : "Add Image"}
              </button>
            </div>
          )}
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

            {/* Product barcodes */}
<div className="mt-6 rounded-xl border border-line p-4">
  <h3 className="font-semibold">
    Product Barcodes
  </h3>

  <p className="mt-1 text-xs text-muted">
    Each product weight has its own barcode.
  </p>

  <div className="mt-4 space-y-3">
    {form.variants?.length ? (
      form.variants.map((variant) => (
        <div
          key={variant.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-2 p-3"
        >
          <div>
            <p className="text-sm font-semibold">
              {variant.variant_name}
            </p>

            <p className="mt-1 font-mono text-sm text-brand">
              {variant.barcode || "Barcode not generated"}
            </p>

{variant.barcode && (
  <BarcodeImage value={variant.barcode} />
)}

            <p className="mt-1 text-xs text-muted">
              SKU: {variant.sku}
            </p>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-muted">
        No variant barcodes available.
      </p>
    )}
  </div>
</div>
            
            
            <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-xs text-muted">
                Description
              </p>

              <p className="mt-1 text-sm">
                {form.description}
              </p>
            </div>

            {/* Moderation controls */}
            <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-sm font-semibold">
                Moderation
              </p>

              <p className="mt-1 text-xs text-muted">
                Review this product listing and
                approve or reject it.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    onUpdateModeration(
                      product,
                      "approved",
                    )
                  }
                >
                  Approve listing
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    onUpdateModeration(
                      product,
                      "rejected",
                    )
                  }
                >
                  Reject listing
                </Button>
              </div>
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
  type PixabayImage = {
    id: number;
    preview: string;
    image: string;
    tags: string;
    photographer: string;
    source: string;
  };

  const [form, setForm] = useState<Product>(emptyProduct);
  const [imageResults, setImageResults] = useState<PixabayImage[]>([]);
  const [selectedPixabayImage, setSelectedPixabayImage] = useState("");
  const [searchingImages, setSearchingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");

  function updateField<K extends keyof Product>(
    field: K,
    value: Product[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function searchImages() {
    const query = `${form.name} ${form.brand}`.trim();

    if (!form.name.trim()) {
      setImageError("Enter the product name first.");
      return;
    }

    setSearchingImages(true);
    setImageError("");
    setImageResults([]);

    try {
      const response = await fetch(
        `/api/products/image-search?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image search failed");
      }

      setImageResults(data.images || []);

      if (!data.images?.length) {
        setImageError("No images found. Try another search.");
      }
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Image search failed"
      );
    } finally {
      setSearchingImages(false);
    }
  }

  async function uploadManualImage(file?: File) {
    if (!file) return;

    setUploadingImage(true);
    setImageError("");
    setSelectedPixabayImage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/products/image-import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image upload failed");
      }

      updateField("image", data.imageUrl);
      setImageError("");
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Image upload failed"
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function submit() {
    if (
      !form.name.trim() ||
      !form.brand.trim() ||
      form.price <= 0 ||
      form.mrp <= 0
    ) {
      return;
    }

    setSaving(true);
    setImageError("");

    try {
      let imageUrl = form.image || "";

      // Copy selected Pixabay image into Supabase Storage.
      if (selectedPixabayImage) {
        const response = await fetch("/api/products/image-import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceUrl: selectedPixabayImage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not save selected image");
        }

        imageUrl = data.imageUrl;
      }

      const id = `p${Date.now()}`;

      const slug = form.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const newProduct: Product = {
        ...form,
        id,
        slug,
        active: true,
        moderation_status: "pending",
        image: imageUrl,
        images: imageUrl ? [imageUrl] : [],
        tiers: [
          {
            minQty: 1,
            price: form.price,
          },
        ],
      };

      onSave(newProduct);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Could not save product image"
      );
    } finally {
      setSaving(false);
    }
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
                updateField("name", e.target.value)
              }
              placeholder="e.g. Fresh Mangoes"
            />
          </Field>

          <Field label="Brand">
            <Input
              value={form.brand}
              onChange={(e) =>
                updateField("brand", e.target.value)
              }
              placeholder="e.g. Fresh Basket"
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) =>
                updateField("category", e.target.value)
              }
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="fruits">Fruits</option>
              <option value="vegetables">Vegetables</option>
              <option value="dairy">Dairy & Eggs</option>
              <option value="staples">Rice, Atta & Grains</option>
              <option value="pulses">Pulses</option>
              <option value="spices">Masala & Spices</option>
              <option value="snacks">Snacks</option>
              <option value="beverages">Beverages</option>
              <option value="household">Household</option>
            </select>
          </Field>

          <Field label="Price">
            <Input
              type="number"
              min="0"
              value={form.price || ""}
              onChange={(e) =>
                updateField("price", Number(e.target.value))
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
                updateField("mrp", Number(e.target.value))
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
                updateField("stock", Number(e.target.value))
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
                updateField("gstRate", Number(e.target.value))
              }
            />
          </Field>

          <Field label="Delivery ETA">
            <Input
              value={form.deliveryEta}
              onChange={(e) =>
                updateField("deliveryEta", e.target.value)
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
        </div>

        {/* Product Image Section */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              Product Image
            </h3>
            <p className="mt-1 text-xs text-muted">
              Search for product images or upload your own.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={searchImages}
              disabled={searchingImages || !form.name.trim()}
            >
              {searchingImages ? "Searching..." : "Search Pixabay Images"}
            </Button>

 <label
  htmlFor="existing-product-image-upload"
  className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900"
>
  {uploadingImage ? "Uploading..." : "Upload Your Image"}

  <input
    id="existing-product-image-upload"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="hidden"
    disabled={uploadingImage}
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (file) {
        uploadManualImage(file);
      }

      e.currentTarget.value = "";
    }}
  />
</label>
          </div>

          {imageError && (
            <p className="text-sm text-red-500">
              {imageError}
            </p>
          )}

          {imageResults.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted">
                Select an image:
              </p>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {imageResults.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedPixabayImage(item.image);
                      updateField("image", item.image);
                      setImageError("");
                    }}
                    className={`overflow-hidden rounded-xl border-2 text-left transition ${
                      selectedPixabayImage === item.image
                        ? "border-brand ring-2 ring-brand/20"
                        : "border-line hover:border-brand"
                    }`}
                  >
                    <img
                      src={item.preview}
                      alt={item.tags || "Product image"}
                      className="h-24 w-full object-cover"
                    />
                    <span className="block truncate px-2 py-1 text-xs">
                      {selectedPixabayImage === item.image
                        ? "✓ Selected"
                        : item.tags}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-2 text-xs text-muted">
                Images provided by Pixabay.
              </p>
            </div>
          )}

          {form.image && (
            <div className="flex items-center gap-3 rounded-xl border border-line p-3">
              <img
                src={form.image}
                alt="Selected product"
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Product image selected
                </p>
                <p className="text-xs text-muted">
                  {selectedPixabayImage
                    ? "Will be saved to Supabase when the product is added."
                    : "Image ready to use."}
                </p>
              </div>
            </div>
          )}

          <Field label="Image URL (optional)">
            <Input
              value={selectedPixabayImage ? "" : form.image}
              onChange={(e) => {
                setSelectedPixabayImage("");
                updateField("image", e.target.value);
              }}
              placeholder="Paste an image URL..."
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              rows={4}
              placeholder="Describe the product..."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-brand"
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={saving || uploadingImage}
          >
            {saving ? "Saving..." : "Add product"}
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