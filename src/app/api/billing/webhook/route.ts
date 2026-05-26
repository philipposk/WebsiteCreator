// Stripe webhook — marks sites as paid after successful checkout.
// Set STRIPE_WEBHOOK_SECRET in env and point Stripe dashboard to /api/billing/webhook.

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient, markPaid } from "@/lib/billing";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = stripeClient();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantId = session.metadata?.tenantId;
    const websiteId = session.metadata?.websiteId;

    if (tenantId && websiteId) {
      await markPaid(tenantId, websiteId, session.id);
    }
  }

  return NextResponse.json({ received: true });
}
