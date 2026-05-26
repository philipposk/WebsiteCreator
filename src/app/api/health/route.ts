import { NextResponse } from "next/server";
import { authConfigured } from "@/auth";

// Surface env-config gaps to the UI so users learn why features are disabled.
export async function GET() {
  return NextResponse.json({
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    groq: !!process.env.GROQ_API_KEY,
    auth: authConfigured(),
    email: !!(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL),
    billing: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
  });
}
