import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { normalizeWebsiteInfo } from "@/lib/normalize";
import { type WebsiteInfo } from "@/lib/types";

type Message = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are a website content assistant helping a small business owner build their website.

You see the current website data below. When the user asks to make changes, update the relevant fields.

Respond ONLY with valid JSON in this exact format — nothing else:
{ "reply": "...", "patch": { /* partial WebsiteInfo to merge */ } }

The "patch" key is optional — omit it if no changes are needed.
Fields you may patch: name, tagline, description, phone, email, address, primaryColor, fontFamily, services, reviews, portfolio, team, blog, products.

Array fields (services, reviews, portfolio, team, blog, products): provide the FULL new array when patching.
Each array item MUST have an "id" field (short unique string like "s1", "r2", "p3").
Services: { id, title, description, price? }
Reviews: { id, author, rating (1-5), text }
Portfolio: { id, title, description }
Team: { id, name, role, bio? }
Blog: { id, title, date?, excerpt }
Products: { id, name, price, description }

primaryColor: valid hex like "#7C3AED".
fontFamily: one of "Inter", "Playfair Display", "Lato", "Merriweather", "Nunito", "Raleway".

Keep replies short and friendly. Confirm what you changed.`;

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
  }

  let body: { messages?: Message[]; current?: Partial<WebsiteInfo> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages: Message[] = (body.messages || []).slice(-12); // keep last 12 turns
  if (!messages.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const current = normalizeWebsiteInfo(body.current ?? {});

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const systemWithContext = `${SYSTEM}\n\nCurrent website data:\n${JSON.stringify(
    {
      name: current.name,
      tagline: current.tagline,
      description: current.description,
      phone: current.phone,
      email: current.email,
      address: current.address,
      primaryColor: current.primaryColor,
      fontFamily: current.fontFamily,
      services: current.services,
      reviews: current.reviews,
      portfolio: current.portfolio,
      team: current.team,
      blog: current.blog,
      products: current.products,
    },
    null,
    2
  )}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemWithContext },
        ...messages,
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { reply?: string; patch?: Partial<WebsiteInfo> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw };
    }

    return NextResponse.json({
      reply: parsed.reply || "Done!",
      patch: parsed.patch ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI error";
    console.error("ai-chat error", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
