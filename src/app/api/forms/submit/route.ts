import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Resend } from "resend";
import { nanoid } from "nanoid";

// Contact form receiver for generated sites. Persists every submission to blob
// (so the owner can never lose a lead) and, if RESEND_API_KEY + CONTACT_TO_EMAIL
// are set, also forwards it via email.

const FROM = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
const TO = process.env.CONTACT_TO_EMAIL;

function thanksHtml(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Thanks</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f7f7f9;color:#1a1a1a}
.card{background:#fff;padding:48px 40px;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.08);text-align:center;max-width:420px}
a{color:#6a5bff}</style></head>
<body><div class="card"><h1>Thanks — message sent</h1><p>We'll get back to you soon.</p>
<p><a href="javascript:history.back()">Back to the site</a></p></div></body></html>`;
}

function badRequestHtml(message: string): string {
  return `<!DOCTYPE html><html><body><p>${message}</p></body></html>`;
}

async function readBody(request: NextRequest): Promise<{
  name: string;
  email: string;
  message: string;
} | null> {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await request.json().catch(() => null);
    if (!j) return null;
    return {
      name: String(j.name ?? "").trim(),
      email: String(j.email ?? "").trim(),
      message: String(j.message ?? "").trim(),
    };
  }
  const fd = await request.formData();
  return {
    name: String(fd.get("name") ?? "").trim(),
    email: String(fd.get("email") ?? "").trim(),
    message: String(fd.get("message") ?? "").trim(),
  };
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const siteId = url.searchParams.get("site") || "unknown";
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");

  const data = await readBody(request);
  if (!data) {
    return wantsHtml
      ? new NextResponse(badRequestHtml("Bad request"), {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      : NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!data.name || !data.email || !data.message) {
    return wantsHtml
      ? new NextResponse(badRequestHtml("Please fill in all fields."), {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      : NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (data.message.length > 5000) {
    return NextResponse.json({ error: "Message too long" }, { status: 413 });
  }

  const submission = {
    id: nanoid(12),
    siteId,
    name: data.name,
    email: data.email,
    message: data.message,
    receivedAt: new Date().toISOString(),
    userAgent: request.headers.get("user-agent") || undefined,
  };

  // Persist to blob (always — owner's safety net).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const path = `submissions/${siteId}/${submission.id}.json`;
      await put(path, JSON.stringify(submission), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: false,
      });
    } catch (err) {
      console.error("submission blob write failed", err);
    }
  } else {
    console.warn("submission received but blob storage not configured", submission);
  }

  // Forward email if Resend configured.
  if (process.env.RESEND_API_KEY && TO) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM,
        to: [TO],
        replyTo: data.email,
        subject: `New contact from ${data.name} (site ${siteId})`,
        text: `From: ${data.name} <${data.email}>\nSite: ${siteId}\n\n${data.message}`,
      });
    } catch (err) {
      console.error("resend send failed", err);
    }
  }

  if (wantsHtml) {
    return new NextResponse(thanksHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.json({ ok: true, id: submission.id });
}
