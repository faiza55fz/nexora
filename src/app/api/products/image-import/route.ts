import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    let buffer: Buffer;
    let contentType: string;

    const incomingType = request.headers.get("content-type") || "";

    if (incomingType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

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
      const { sourceUrl } = await request.json();

      if (!sourceUrl) {
        return NextResponse.json(
          { error: "Image URL is required" },
          { status: 400 }
        );
      }

      const url = new URL(sourceUrl);

      if (
        url.protocol !== "https:" ||
        !(url.hostname === "pixabay.com" ||
          url.hostname.endsWith(".pixabay.com"))
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
          { error: "Could not download the selected image" },
          { status: 502 }
        );
      }

      contentType = response.headers.get("content-type")?.split(";")[0] || "";

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

    const extension =
      contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : "jpg";

    const path = `${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Product image upload error:", uploadError);
      return NextResponse.json(
        { error: "Could not save image to storage" },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    console.error("Product image import error:", error);

    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}