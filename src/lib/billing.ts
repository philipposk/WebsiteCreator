// Billing helpers — server-only (imports stripe).
// Always check process.env.STRIPE_SECRET_KEY before calling these.

import Stripe from "stripe";
import { put, list } from "@vercel/blob";

export function stripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

export function billingEnabled(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

// Blob path: payments/<tenantId>/<websiteId>.json
function paymentPath(tenantId: string, websiteId: string) {
  return `payments/${tenantId}/${websiteId}.json`;
}

export async function isPaid(tenantId: string, websiteId: string): Promise<boolean> {
  if (!billingEnabled()) return true; // bypass when Stripe not configured
  try {
    const { blobs } = await list({ prefix: paymentPath(tenantId, websiteId), limit: 1 });
    if (!blobs[0]) return false;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.paid === true;
  } catch {
    return false;
  }
}

export async function markPaid(
  tenantId: string,
  websiteId: string,
  sessionId: string
): Promise<void> {
  await put(
    paymentPath(tenantId, websiteId),
    JSON.stringify({ paid: true, sessionId, paidAt: new Date().toISOString() }),
    {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
    }
  );
}
