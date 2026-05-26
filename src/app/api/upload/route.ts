import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { getTenant, tenantPrefix } from "@/lib/tenant";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const allowedImage = /^image\/(png|jpeg|jpg|webp|gif|svg\+xml)$/i;

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const tenant = await getTenant();
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = (formData.get("type") as string | null) || "image";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_BYTES / 1024 / 1024}MB)` },
        { status: 413 }
      );
    }
    if (kind === "image" && !allowedImage.test(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, GIF, or SVG images are allowed" },
        { status: 415 }
      );
    }

    const ext =
      file.name.includes(".") ? file.name.split(".").pop() : kind === "image" ? "jpg" : "bin";
    const filename = `${Date.now()}-${nanoid(8)}.${ext}`;
    const path = `${tenantPrefix(tenant)}/uploads/${filename}`;

    const blob = await put(path, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blob.url,
      filename,
      type: file.type,
      name: file.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("upload error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
