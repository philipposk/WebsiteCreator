import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type AnyObj = Record<string, unknown>;

const SYSTEM_PROMPT = `You are a website content generator. Given a short business description, output JSON only (no prose, no markdown fences) matching this exact shape:

{
  "name": string,
  "tagline": string,
  "description": string,
  "services": [{ "title": string, "description": string, "price": string }],
  "reviews": [{ "author": string, "rating": number (1-5), "text": string }],
  "portfolio": [{ "title": string, "description": string }],
  "team": [{ "name": string, "role": string, "bio": string }],
  "blog": [{ "title": string, "date": string, "excerpt": string }],
  "products": [{ "name": string, "price": string, "description": string }]
}

Rules:
- Generate 3-5 services, 3 reviews, 3 portfolio items, 2-3 team members, 2 blog posts, 3 products.
- Reviews must look realistic (first name + last initial). Mix 4 and 5 star ratings.
- Prices in plain text like "$45" or "From $99".
- All copy in the same language as the input description. English if ambiguous.
- Do not invent contact info (phone/email/address) — leave those for the user.
- Keep descriptions to 1-2 sentences. Don't repeat the business name in every line.`;

function stripCodeFence(s: string): string {
  return s
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function withIds<T extends AnyObj>(arr: unknown): (T & { id: string })[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((it) => ({ ...(it as T), id: uid() }));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = (await request.json()) as { prompt?: string };
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: AnyObj;
    try {
      parsed = JSON.parse(stripCodeFence(raw)) as AnyObj;
    } catch {
      console.error("AI fill: invalid JSON from model", raw);
      return NextResponse.json(
        { error: "Model returned invalid JSON" },
        { status: 502 }
      );
    }

    const suggestion = {
      name: typeof parsed.name === "string" ? parsed.name : "",
      tagline: typeof parsed.tagline === "string" ? parsed.tagline : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
      services: withIds(parsed.services),
      reviews: withIds(parsed.reviews).map((r) => ({
        ...r,
        rating: Math.max(1, Math.min(5, Number((r as AnyObj).rating ?? 5))),
      })),
      portfolio: withIds(parsed.portfolio),
      team: withIds(parsed.team),
      blog: withIds(parsed.blog),
      products: withIds(parsed.products),
    };

    return NextResponse.json({ suggestion });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("AI fill error:", error);
    return NextResponse.json(
      { error: "AI fill failed", details: message },
      { status: 500 }
    );
  }
}
