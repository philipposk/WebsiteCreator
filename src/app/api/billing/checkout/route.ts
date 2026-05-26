// Create a Stripe Checkout session for publishing a site.
// POST body: { websiteId: string, websiteName: string }
// Returns: { url: string } — the Stripe-hosted checkout URL

import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { stripeClient, billingEnabled, isPaid } from "@/lib/billing";

function originFromRequest(req: NextRequest): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    websiteId: string;
    websiteName?: string;
  };

  if (!body.websiteId) {
    return NextResponse.json({ error: "websiteId is required" }, { status: 400 });
  }

  const tenant = await getTenant();

  // Already paid — no need to charge again
  if (await isPaid(tenant.id, body.websiteId)) {
    return NextResponse.json({ alreadyPaid: true });
  }

  const stripe = stripeClient();
  const origin = originFromRequest(request);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: {
      tenantId: tenant.id,
      websiteId: body.websiteId,
    },
    success_url: `${origin}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?canceled=1`,
    payment_intent_data: {
      description: `Website publish: ${body.websiteName || body.websiteId}`,
    },
  });

  return NextResponse.json({ url: session.url });
}
