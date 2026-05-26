// Post-payment success redirect.
// Stripe sends user here after checkout with ?session_id=...
// We verify the session, mark the site as paid, then redirect home.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeClient, markPaid } from "@/lib/billing";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const tenantId = session.metadata?.tenantId;
      const websiteId = session.metadata?.websiteId;
      if (tenantId && websiteId) {
        await markPaid(tenantId, websiteId, sessionId);
        return NextResponse.redirect(
          new URL(`/?paid=${encodeURIComponent(websiteId)}`, request.url)
        );
      }
    }
  } catch (err) {
    console.error("billing success handler", err);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
