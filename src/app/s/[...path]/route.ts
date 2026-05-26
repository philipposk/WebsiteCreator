import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

// Public site viewer. Catch-all so a single slug can serve multiple files:
//   /s/<slug>                 -> index.html
//   /s/<slug>/sitemap.xml     -> sitemap
//   /s/<slug>/robots.txt      -> robots
//   /s/<slug>/<other-path>    -> 404
// Slug -> tenant resolution happens via the sites-index/<slug>.json lookup
// written at publish time. The viewer never needs to know the tenant id.

export const revalidate = 30;

type Indexed = {
  tenantId: string;
  websiteId?: string;
  blobUrl?: string;
  sitemapUrl?: string;
  robotsUrl?: string;
};

async function resolveSlug(slug: string): Promise<Indexed | null> {
  try {
    const { blobs } = await list({ prefix: `sites-index/${slug}.json`, limit: 1 });
    if (!blobs[0]) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Indexed;
  } catch {
    return null;
  }
}

async function proxy(url: string, contentType: string): Promise<NextResponse> {
  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) return new NextResponse("Not found", { status: 404 });
  const body = await upstream.text();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path?.length) return new NextResponse("Not found", { status: 404 });
  const [slug, ...rest] = path;
  if (!slug || slug.length > 64) return new NextResponse("Not found", { status: 404 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Publishing is not configured on this server.", { status: 503 });
  }

  const idx = await resolveSlug(slug);
  if (!idx) return new NextResponse("Site not found", { status: 404 });

  const sub = rest.join("/");
  if (sub === "" && idx.blobUrl) return proxy(idx.blobUrl, "text/html; charset=utf-8");
  if (sub === "sitemap.xml" && idx.sitemapUrl) return proxy(idx.sitemapUrl, "application/xml");
  if (sub === "robots.txt" && idx.robotsUrl) return proxy(idx.robotsUrl, "text/plain");
  return new NextResponse("Not found", { status: 404 });
}
