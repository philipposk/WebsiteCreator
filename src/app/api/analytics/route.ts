// Lightweight page-view counter backed by Vercel Blob.
// GET  /api/analytics?site=<siteId>  -> { views: number }
// POST /api/analytics?site=<siteId>  -> increments and returns 1×1 transparent GIF
//
// The generated HTML embeds <img src="/api/analytics?site=SITE_ID"> so every
// real page-load (when served via /s/[...path]) pings this endpoint.
// The pixel is only injected when buildHTML is called with a siteId.

import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const GIF_1X1 = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function counterPath(siteId: string) {
  return `analytics/${siteId}/views.json`;
}

async function readCount(siteId: string): Promise<number> {
  try {
    const { blobs } = await list({ prefix: counterPath(siteId), limit: 1 });
    if (!blobs[0]) return 0;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.views === "number" ? data.views : 0;
  } catch {
    return 0;
  }
}

async function incrementCount(siteId: string): Promise<number> {
  const current = await readCount(siteId);
  const next = current + 1;
  await put(counterPath(siteId), JSON.stringify({ views: next, updatedAt: new Date().toISOString() }), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  return next;
}

export async function GET(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get("site");
  if (!siteId) {
    return NextResponse.json({ error: "site param required" }, { status: 400 });
  }

  // Beacon request from pixel img — increment + return GIF
  const accept = request.headers.get("accept") || "";
  if (accept.includes("image/") || accept === "*/*") {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // fire-and-forget increment, don't block response
      incrementCount(siteId).catch(() => {});
    }
    return new NextResponse(GIF_1X1, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  }

  // JSON read request from dashboard
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ views: 0 });
  }
  const views = await readCount(siteId);
  return NextResponse.json({ views });
}

export async function POST(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get("site");
  if (!siteId) {
    return NextResponse.json({ error: "site param required" }, { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ views: 0 });
  }
  const views = await incrementCount(siteId);
  return NextResponse.json({ views });
}
