import { NextRequest, NextResponse } from "next/server";
import { type WebsiteInfo } from "@/lib/types";
import { buildHTML } from "@/lib/build-html";
import { normalizeWebsiteInfo } from "@/lib/normalize";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const websiteInfo = body.websiteInfo as WebsiteInfo | undefined;
    const siteId = typeof body.siteId === "string" ? body.siteId : undefined;

    if (!websiteInfo) {
      return NextResponse.json({ error: "Website info is required" }, { status: 400 });
    }
    if (!websiteInfo.name?.trim()) {
      return NextResponse.json({ error: "Website name is required" }, { status: 400 });
    }

    const safe = normalizeWebsiteInfo(websiteInfo);
    const html = buildHTML(safe, { siteId });
    return NextResponse.json({ html });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating website:", error);
    return NextResponse.json(
      { error: "Failed to generate website", details: message },
      { status: 500 }
    );
  }
}
