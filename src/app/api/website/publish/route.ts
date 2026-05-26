import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { getTenant, tenantPrefix } from "@/lib/tenant";
import { buildHTML, slugify } from "@/lib/build-html";
import { normalizeWebsiteInfo } from "@/lib/normalize";
import { type WebsiteInfo } from "@/lib/types";

// Publish a draft to a public URL backed by Vercel Blob.
// Layout: tenants/<tenantId>/sites/<slug>/index.html
//         sites-index/<slug>.json  -> { tenantId, blobUrl, publishedAt }
// The slug index lets the dynamic /s/[slug] route resolve a public slug to its
// origin blob without needing to know the tenant in advance.

type PublishBody = {
  websiteId: string;
  websiteInfo: WebsiteInfo;
  desiredSlug?: string;
};

function originFromRequest(req: NextRequest): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

async function isSlugAvailable(slug: string, tenantId: string): Promise<boolean> {
  try {
    const { blobs } = await list({ prefix: `sites-index/${slug}.json`, limit: 1 });
    if (!blobs[0]) return true;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return true;
    const data = await res.json();
    return data?.tenantId === tenantId;
  } catch {
    return true;
  }
}

async function pickAvailableSlug(base: string, tenantId: string): Promise<string> {
  let slug = slugify(base);
  if (await isSlugAvailable(slug, tenantId)) return slug;
  for (let i = 2; i < 50; i++) {
    const candidate = `${slug}-${i}`;
    if (await isSlugAvailable(candidate, tenantId)) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Publishing requires BLOB_READ_WRITE_TOKEN on the server" },
      { status: 500 }
    );
  }

  try {
    const tenant = await getTenant();
    const body = (await request.json()) as PublishBody;
    if (!body?.websiteId) {
      return NextResponse.json({ error: "websiteId is required" }, { status: 400 });
    }
    const info = normalizeWebsiteInfo(body.websiteInfo);
    if (!info.name.trim()) {
      return NextResponse.json({ error: "Website name is required" }, { status: 400 });
    }

    const baseSlug = body.desiredSlug || info.slug || info.name;
    const slug = await pickAvailableSlug(baseSlug, tenant.id);

    const origin = originFromRequest(request);
    const canonicalUrl = `${origin}/s/${slug}`;
    const html = buildHTML(info, { siteId: body.websiteId, canonicalUrl });

    const tenantPath = tenantPrefix(tenant);
    const publishedAt = new Date().toISOString();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${publishedAt.slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    const robots = `User-agent: *\nAllow: /\nSitemap: ${canonicalUrl}/sitemap.xml\n`;

    const [siteBlob, sitemapBlob, robotsBlob] = await Promise.all([
      put(`${tenantPath}/sites/${slug}/index.html`, html, {
        access: "public",
        contentType: "text/html; charset=utf-8",
        allowOverwrite: true,
        addRandomSuffix: false,
      }),
      put(`${tenantPath}/sites/${slug}/sitemap.xml`, sitemap, {
        access: "public",
        contentType: "application/xml",
        allowOverwrite: true,
        addRandomSuffix: false,
      }),
      put(`${tenantPath}/sites/${slug}/robots.txt`, robots, {
        access: "public",
        contentType: "text/plain",
        allowOverwrite: true,
        addRandomSuffix: false,
      }),
    ]);

    const indexPath = `sites-index/${slug}.json`;
    const indexPayload = JSON.stringify({
      tenantId: tenant.id,
      websiteId: body.websiteId,
      blobUrl: siteBlob.url,
      sitemapUrl: sitemapBlob.url,
      robotsUrl: robotsBlob.url,
      publishedAt,
    });
    await put(indexPath, indexPayload, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    return NextResponse.json({
      ok: true,
      slug,
      url: canonicalUrl,
      blobUrl: siteBlob.url,
      sitemapUrl: `${canonicalUrl}/sitemap.xml`,
      robotsUrl: `${canonicalUrl}/robots.txt`,
      publishedAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("publish error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
