import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

// Public site viewer. Resolves slug -> blob URL via sites-index and proxies the HTML.
// Cached briefly so re-publish propagates within ~30s without manual purge.

export const revalidate = 30;

async function resolveSlug(slug: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: `sites-index/${slug}.json`, limit: 1 });
    if (!blobs[0]) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.blobUrl === "string" ? data.blobUrl : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug || slug.length > 64) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Publishing is not configured on this server.", {
      status: 503,
    });
  }

  const blobUrl = await resolveSlug(slug);
  if (!blobUrl) {
    return new NextResponse("Site not found", { status: 404 });
  }

  const upstream = await fetch(blobUrl, { cache: "no-store" });
  if (!upstream.ok) {
    return new NextResponse("Failed to load site", { status: 502 });
  }
  const html = await upstream.text();
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
