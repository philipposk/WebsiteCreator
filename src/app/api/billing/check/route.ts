// Check if a site has been paid for.
// GET /api/billing/check?site=<websiteId>
// Returns: { paid: boolean, billingEnabled: boolean }

import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { isPaid, billingEnabled } from "@/lib/billing";

export async function GET(request: NextRequest) {
  const websiteId = request.nextUrl.searchParams.get("site");
  if (!websiteId) {
    return NextResponse.json({ error: "site param required" }, { status: 400 });
  }

  if (!billingEnabled()) {
    return NextResponse.json({ paid: true, billingEnabled: false });
  }

  const tenant = await getTenant();
  const paid = await isPaid(tenant.id, websiteId);
  return NextResponse.json({ paid, billingEnabled: true });
}
