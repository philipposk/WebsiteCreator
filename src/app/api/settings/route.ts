import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { getTenant, tenantPrefix } from "@/lib/tenant";

// Per-tenant settings blob. Anonymous visitors get a cookie-based tenant id so they
// don't collide with each other; once signed in, the user-id namespace takes over.

const settingsKey = (tenantPath: string) => `${tenantPath}/settings.json`;

async function findSettingsBlobUrl(tenantPath: string): Promise<string | null> {
  const key = settingsKey(tenantPath);
  try {
    const { blobs } = await list({ prefix: key, limit: 5 });
    const exact = blobs.find((b) => b.pathname === key);
    return exact?.url ?? blobs[0]?.url ?? null;
  } catch (err) {
    console.error("settings.list error", err);
    return null;
  }
}

export async function GET() {
  const tenant = await getTenant();
  const prefix = tenantPrefix(tenant);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ settings: null, tenant: tenant.kind });
  }

  try {
    const url = await findSettingsBlobUrl(prefix);
    if (!url) return NextResponse.json({ settings: null, tenant: tenant.kind });

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ settings: null, tenant: tenant.kind });
    }
    const text = await res.text();
    if (!text.trim()) return NextResponse.json({ settings: null, tenant: tenant.kind });
    const settings = JSON.parse(text);
    return NextResponse.json({ settings, tenant: tenant.kind });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("settings.GET error", err);
    return NextResponse.json(
      { settings: null, error: message, tenant: tenant.kind },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const tenant = await getTenant();
  const prefix = tenantPrefix(tenant);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { settings } = body;
    if (!settings) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    const key = settingsKey(prefix);
    const json = JSON.stringify(settings);
    const file = new Blob([json], { type: "application/json" });

    const blob = await put(key, file, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true, url: blob.url, tenant: tenant.kind });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("settings.POST error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const tenant = await getTenant();
  const prefix = tenantPrefix(tenant);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: true });
  }
  try {
    const url = await findSettingsBlobUrl(prefix);
    if (url) await del(url);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
