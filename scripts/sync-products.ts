import { loadEnvFile } from "node:process";

loadEnvFile(".env.local");


import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const EXCEL_PATH = path.join(
  process.cwd(),
  "data",
  "inventory.xlsx",
);

const TEST_LIMIT = 200;

type ExcelRow = {
  NAME?: unknown;
  BRAND?: unknown;
  BARCODE?: unknown;
  "SKU CODE"?: unknown;
  "PRODUCT CODE"?: unknown;
  MRP?: unknown;
  "ONLINE PRICE"?: unknown;
  "SALE PRICE"?: unknown;
  WEIGHT?: unknown;
  QUANTITY?: unknown;
  TAX?: unknown;
  CATEGORY?: unknown;
  "SUB CATEGORY"?: unknown;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function number(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(
    String(value).replace(/,/g, "").trim(),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "");
}

function makeHash(input: string): string {
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();
}

function makeSku(
  name: string,
  brand: string,
  weight: string,
): string {
  const key = `${normalize(name)}|${normalize(brand)}|${normalize(weight)}`;

  return `SS-${makeHash(key)}`;
}

function makeBarcode(
  name: string,
  brand: string,
  weight: string,
): string {
  const key = `${normalize(name)}|${normalize(brand)}|${normalize(weight)}`;

  return `SS${makeHash(key)}`;
}

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,active");

  if (error) {
    throw new Error(
      `Failed to load categories: ${error.message}`,
    );
  }

  return data ?? [];
}

async function getExistingProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,brand,category_id,subcategory,active,moderation_status",
    );

  if (error) {
    throw new Error(
      `Failed to load products: ${error.message}`,
    );
  }

  return data ?? [];
}

async function getExistingVariants() {
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id,product_id,sku,barcode,variant_name,mrp,selling_price,gst_rate,unit,quantity_value,active,max_order_quantity",
    );

  if (error) {
    throw new Error(
      `Failed to load variants: ${error.message}`,
    );
  }

  return data ?? [];
}

async function findOrCreateCategory(
  categoryName: string,
  categories: any[],
) {
  const normalized = normalize(categoryName);

  if (!normalized || normalized === "miscellaneous") {
    return null;
  }

  const existing = categories.find(
    (category) =>
      normalize(category.name) === normalized,
  );

  if (existing) {
    return existing;
  }

  console.log(`Creating category: ${categoryName}`);

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: categoryName.trim(),
      description: `${categoryName.trim()} products`,
      active: true,
    })
    .select("id,name,active")
    .single();

  if (error) {
    throw new Error(
      `Failed to create category "${categoryName}": ${error.message}`,
    );
  }

  categories.push(data);

  return data;
}

async function findExistingProduct(
  name: string,
  brand: string,
  products: any[],
) {
  const normalizedName = normalize(name);
  const normalizedBrand = normalize(brand);

  return products.find((product) => {
    return (
      normalize(product.name) === normalizedName &&
      normalize(product.brand ?? "") === normalizedBrand
    );
  });
}

async function findExistingVariant(
  productId: string,
  variantName: string,
  variants: any[],
) {
  const normalizedVariant = normalize(variantName);

  return variants.find(
    (variant) =>
      variant.product_id === productId &&
      normalize(variant.variant_name ?? "") ===
        normalizedVariant,
  );
}

async function main() {
  console.log("======================================");
  console.log(" SundayShop Product Sync");
  console.log(" TEST MODE: 200 PRODUCTS");
  console.log("======================================");

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(
      `Excel file not found:\n${EXCEL_PATH}`,
    );
  }

  console.log("\nReading Excel...");

  const workbook = XLSX.readFile(EXCEL_PATH);

  const sheetName = workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(
    sheet,
    {
      defval: "",
    },
  );

  console.log(`Excel rows found: ${rows.length}`);

  const usableRows = rows.filter((row) => {
    const name = text(row.NAME);
    const category = text(row.CATEGORY);

    return (
      name &&
      category &&
      category.toLowerCase() !== "miscellaneous"
    );
  });

  console.log(
    `Usable non-Miscellaneous rows: ${usableRows.length}`,
  );

  const selectedRows = usableRows.slice(
    0,
    TEST_LIMIT,
  );

  console.log(
    `Rows selected for this test: ${selectedRows.length}`,
  );

  console.log("\nLoading existing Supabase data...");

  const categories = await getCategories();

  const products = await getExistingProducts();

  const variants = await getExistingVariants();

  console.log(
    `Existing categories: ${categories.length}`,
  );

  console.log(
    `Existing products: ${products.length}`,
  );

  console.log(
    `Existing variants: ${variants.length}`,
  );

  let createdProducts = 0;
  let updatedProducts = 0;
  let createdVariants = 0;
  let updatedVariants = 0;
  let createdInventory = 0;
  let updatedInventory = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < selectedRows.length; i++) {
    const row = selectedRows[i];

    const name = text(row.NAME);
    const brand = text(row.BRAND);
    const categoryName = text(row.CATEGORY);
    const subcategory = text(row["SUB CATEGORY"]);
    const weight = text(row.WEIGHT);

    const mrp = number(row.MRP);

    const onlinePrice =
      number(row["ONLINE PRICE"]) ||
      number(row["SALE PRICE"]);

    const quantity = Math.max(
      0,
      Math.floor(number(row.QUANTITY)),
    );

    const gstRate = number(row.TAX);

    if (!name || !categoryName) {
      skipped++;
      continue;
    }

    const sku = makeSku(
      name,
      brand,
      weight,
    );

    const barcode = makeBarcode(
      name,
      brand,
      weight,
    );

    try {
      console.log(
        `\n[${i + 1}/${selectedRows.length}] ${name}`,
      );

      const category =
        await findOrCreateCategory(
          categoryName,
          categories,
        );

      if (!category) {
        console.log(
          "  Skipped: category unavailable",
        );

        skipped++;
        continue;
      }

      let product =
        await findExistingProduct(
          name,
          brand,
          products,
        );

      if (!product) {
        const { data, error } =
          await supabase
            .from("products")
            .insert({
              id: crypto.randomUUID(),
              category_id: category.id,
              name,
              brand: brand || null,
              subcategory:
                subcategory || null,
              description: null,
              active: true,
              rating: 0,
              review_count: 0,
              moderation_status:
                "approved",
            })
            .select()
            .single();

        if (error) {
          throw new Error(
            `Product insert failed: ${error.message}`,
          );
        }

        product = data;

        products.push(product);

        createdProducts++;

        console.log(
          `  Product created: ${product.id}`,
        );
      } else {
        const { data, error } =
          await supabase
            .from("products")
            .update({
              category_id: category.id,
              brand: brand || null,
              subcategory:
                subcategory || null,
              active: true,
            })
            .eq("id", product.id)
            .select()
            .single();

        if (error) {
          throw new Error(
            `Product update failed: ${error.message}`,
          );
        }

        product = data;

        updatedProducts++;

        console.log(
          `  Existing product updated: ${product.id}`,
        );
      }

      const variantName =
        weight || "1 unit";

      let variant =
        await findExistingVariant(
          product.id,
          variantName,
          variants,
        );

      if (!variant) {
        const { data, error } =
          await supabase
            .from("product_variants")
            .insert({
              product_id: product.id,
              sku,
              barcode,
              variant_name:
                variantName,
              mrp,
              selling_price:
                onlinePrice || mrp,
              gst_rate: gstRate,
              unit: variantName,
              quantity_value: 1,
              active: true,
              max_order_quantity: 5,
            })
            .select()
            .single();

        if (error) {
          throw new Error(
            `Variant insert failed: ${error.message}`,
          );
        }

        variant = data;

        variants.push(variant);

        createdVariants++;

        console.log(
          `  Variant created: ${variant.id}`,
        );
        console.log(
          `  SKU: ${sku}`,
        );
        console.log(
          `  Barcode: ${barcode}`,
        );
      } else {
        const updateData: Record<
          string,
          unknown
        > = {
          mrp,
          selling_price:
            onlinePrice || mrp,
          gst_rate: gstRate,
          unit: variantName,
          variant_name: variantName,
          active: true,
          max_order_quantity: 5,
        };

        if (!variant.barcode) {
          updateData.barcode = barcode;
        }

        const { data, error } =
          await supabase
            .from("product_variants")
            .update(updateData)
            .eq("id", variant.id)
            .select()
            .single();

        if (error) {
          throw new Error(
            `Variant update failed: ${error.message}`,
          );
        }

        variant = data;

        updatedVariants++;

        console.log(
          `  Existing variant updated: ${variant.id}`,
        );
      }

      const { data: existingInventory } =
        await supabase
          .from("inventory")
          .select(
            "variant_id,stock_quantity,reserved_quantity,low_stock_threshold",
          )
          .eq("variant_id", variant.id)
          .maybeSingle();

      if (!existingInventory) {
        const { error } =
          await supabase
            .from("inventory")
            .insert({
              variant_id: variant.id,
              stock_quantity: quantity,
              reserved_quantity: 0,
              low_stock_threshold: 5,
            });

        if (error) {
          throw new Error(
            `Inventory insert failed: ${error.message}`,
          );
        }

        createdInventory++;

        console.log(
          `  Inventory created: ${quantity}`,
        );
      } else {
        const { error } =
          await supabase
            .from("inventory")
            .update({
              stock_quantity: quantity,
              low_stock_threshold: 5,
            })
            .eq(
              "variant_id",
              variant.id,
            );

        if (error) {
          throw new Error(
            `Inventory update failed: ${error.message}`,
          );
        }

        updatedInventory++;

        console.log(
          `  Inventory updated: ${quantity}`,
        );
      }
    } catch (error) {
      errors++;

      console.error(
        `  ERROR: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  console.log("\n======================================");
  console.log(" SYNC COMPLETE");
  console.log("======================================");

  console.log(
    `Products created:       ${createdProducts}`,
  );

  console.log(
    `Products updated:       ${updatedProducts}`,
  );

  console.log(
    `Variants created:       ${createdVariants}`,
  );

  console.log(
    `Variants updated:       ${updatedVariants}`,
  );

  console.log(
    `Inventory created:      ${createdInventory}`,
  );

  console.log(
    `Inventory updated:      ${updatedInventory}`,
  );

  console.log(
    `Skipped:                ${skipped}`,
  );

  console.log(
    `Errors:                 ${errors}`,
  );

  console.log("======================================");
}

main().catch((error) => {
  console.error("\nSYNC FAILED");
  console.error(error);
  process.exit(1);
});