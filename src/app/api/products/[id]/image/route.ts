
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  let storagePath = "";

  try {
    const { id: productId } = await context.params;

    let buffer: Buffer;
    let contentType: string;
    let action = "replace";

    const incomingType = request.headers.get("content-type") || "";

    if (incomingType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      action = String(formData.get("action") || "replace");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Please select an image" },
          { status: 400 }
        );
      }

      contentType = file.type;

      if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
        return NextResponse.json(
          { error: "Only JPG, PNG and WEBP images are supported" },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "Image must be smaller than 5 MB" },
          { status: 400 }
        );
      }

      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await request.json();
      const { sourceUrl } = body;
      action = body.action || "replace";

      if (!sourceUrl) {
        return NextResponse.json(
          { error: "Image URL is required" },
          { status: 400 }
        );
      }

      const url = new URL(sourceUrl);

      if (
        url.protocol !== "https:" ||
        !(
          url.hostname === "pixabay.com" ||
          url.hostname.endsWith(".pixabay.com")
        )
      ) {
        return NextResponse.json(
          { error: "Invalid image source" },
          { status: 400 }
        );
      }

      const response = await fetch(sourceUrl, {
        redirect: "error",
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Could not download selected image" },
          { status: 502 }
        );
      }

      contentType =
        response.headers.get("content-type")?.split(";")[0] || "";

      if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
        return NextResponse.json(
          { error: "Unsupported image format" },
          { status: 400 }
        );
      }

      const data = await response.arrayBuffer();

      if (data.byteLength > MAX_SIZE) {
        return NextResponse.json(
          { error: "Image must be smaller than 5 MB" },
          { status: 400 }
        );
      }

      buffer = Buffer.from(data);
    }

    if (!["replace", "add"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid image action" },
        { status: 400 }
      );
    }

    const { data: existingImages, error: findError } =
      await supabaseAdmin
        .from("product_images")
        .select("id, image_url, display_order, is_primary")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

    if (findError) throw findError;

    const images = existingImages || [];

    // Additional images are optional, but limited to five.
    if (action === "add" && images.length >= MAX_IMAGES) {
      return NextResponse.json(
        { error: "A product can have a maximum of 5 images." },
        { status: 400 }
      );
    }

    const extension =
      contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : "jpg";

    storagePath = `${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: "Could not upload image to storage" },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const imageUrl = publicData.publicUrl;

    if (action === "add") {
      // Add an optional image without changing the primary image.
      const nextOrder =
        images.length > 0
          ? Math.max(...images.map((image) => image.display_order ?? 0)) + 1
          : 0;

      const { error: insertError } = await supabaseAdmin
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          display_order: nextOrder,
          is_primary: images.length === 0,
        });

      if (insertError) throw insertError;
    } else {
      // Preserve existing primary-image replacement behaviour.
      const existingPrimary =
        images.find((image) => image.is_primary) || images[0];

      if (existingPrimary) {
        const { error: updateError } = await supabaseAdmin
          .from("product_images")
          .update({
            image_url: imageUrl,
            is_primary: true,
            display_order: 0,
          })
          .eq("id", existingPrimary.id);

        if (updateError) throw updateError;

        if (!existingPrimary.is_primary) {
          const { error: resetError } = await supabaseAdmin
            .from("product_images")
            .update({ is_primary: false })
            .eq("product_id", productId)
            .neq("id", existingPrimary.id);

          if (resetError) throw resetError;
        } else {
          const { error: resetError } = await supabaseAdmin
            .from("product_images")
            .update({ is_primary: false })
            .eq("product_id", productId)
            .neq("id", existingPrimary.id);

          if (resetError) throw resetError;
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: imageUrl,
            display_order: 0,
            is_primary: true,
          });

        if (insertError) throw insertError;
      }
    }

    const { data: savedImages, error: savedImagesError } =
      await supabaseAdmin
        .from("product_images")
        .select("id, image_url, display_order, is_primary")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

    if (savedImagesError) throw savedImagesError;

    return NextResponse.json({
      imageUrl,
      images: savedImages || [],
    });
  } catch (error) {
    console.error("Product image upload error:", error);

    // Clean up the newly uploaded file if its database save failed.
    if (storagePath) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([storagePath]);
    }

    return NextResponse.json(
      { error: "Could not save product image" },
      { status: 500 }
    );
  }
}
