// Reverse-mode: scrape a URL and use Groq to reconstruct an editable WebsiteInfo.
// POST body: { url: string }
// Returns: { suggestion: Partial<WebsiteInfo> }

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const MAX_HTML = 12_000; // chars to feed Groq — enough for metadata + main content

function extractText(html: string): string {
  // Strip scripts, styles, nav, footer blobs — keep visible text
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, MAX_HTML);
}

function extractMeta(html: string): Record<string, string> {
  const out: Record<string, string> = {};

  // <title>
  const title = /<title[^>]*>([^<]+)/i.exec(html);
  if (title) out.title = title[1].trim();

  // <meta name="description">
  const desc = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i.exec(html) ||
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i.exec(html);
  if (desc) out.description = desc[1].trim();

  // <meta property="og:title">
  const ogTitle = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i.exec(html);
  if (ogTitle) out.ogTitle = ogTitle[1].trim();

  // phone: tel: links
  const tel = /href=["']tel:([^"']+)/i.exec(html);
  if (tel) out.phone = tel[1].trim();

  // email: mailto: links
  const mail = /href=["']mailto:([^"'?]+)/i.exec(html);
  if (mail) out.email = mail[1].trim();

  // JSON-LD address
  const ldMatch = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldMatch.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const addr = data.address || data.location?.address;
      if (addr) {
        out.address = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode]
          .filter(Boolean)
          .join(", ");
      }
      if (data.telephone) out.phone = out.phone || data.telephone;
      if (data.email) out.email = out.email || data.email;
      if (data.name) out.schemaName = data.name;
    } catch {
      // skip
    }
  }

  return out;
}

const SYSTEM = `You are a website content extractor. The user has provided raw HTML text scraped from an existing business website. Extract structured business info and return ONLY valid JSON matching this TypeScript type:

{
  name: string,           // business name
  tagline: string,        // short catchy tagline (invent if not present, ≤10 words)
  description: string,    // about section (2-3 sentences)
  phone: string,
  email: string,
  address: string,
  primaryColor: string,   // guess a fitting hex color based on the industry — DO NOT use #000000 or #ffffff
  services: Array<{ id: string, title: string, description: string, price?: string }>,  // 3-5 items
  reviews: Array<{ id: string, author: string, rating: number, text: string }>,         // 2-3 plausible reviews
  team: Array<{ id: string, name: string, role: string, bio?: string }>,                // 0-3 if detectable
  blog: Array<{ id: string, title: string, date?: string, excerpt: string }>,           // 0-2 if detectable
  products: Array<{ id: string, name: string, price: string, description: string }>    // only if e-commerce
}

Rules:
- Keep array item ids short (s1, s2, r1, r2, t1, etc.)
- If a field cannot be extracted, make a reasonable inference based on the business type.
- Return ONLY the JSON object, no explanation.`;

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch the page server-side
  let html = "";
  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WebsiteImporter/1.0; +https://websitecreator.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch page (${res.status})` },
        { status: 422 }
      );
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) {
      return NextResponse.json({ error: "URL does not return HTML" }, { status: 422 });
    }
    html = await res.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: `Could not reach URL: ${msg}` }, { status: 422 });
  }

  const meta = extractMeta(html);
  const text = extractText(html);

  const context = `
URL: ${url.toString()}
Title: ${meta.title || ""}
OG Title: ${meta.ogTitle || ""}
Schema name: ${meta.schemaName || ""}
Description: ${meta.description || ""}
Phone: ${meta.phone || ""}
Email: ${meta.email || ""}
Address: ${meta.address || ""}

Page text (first ~12000 chars):
${text}
`.trim();

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let suggestion: Record<string, unknown>;
    try {
      suggestion = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ suggestion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI error";
    console.error("import-url groq error", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
