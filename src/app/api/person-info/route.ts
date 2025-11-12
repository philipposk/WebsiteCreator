import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const PERSON_INFO_FILE = join(process.cwd(), "data", "person-info.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureDataDir();
    
    if (!existsSync(PERSON_INFO_FILE)) {
      return NextResponse.json({ personInfo: null });
    }

    const data = await readFile(PERSON_INFO_FILE, "utf-8");
    const personInfo = JSON.parse(data);

    return NextResponse.json({ personInfo });
  } catch (error) {
    console.error("Error reading person info:", error);
    return NextResponse.json({ personInfo: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();

    const body = await request.json();
    const { personInfo } = body;

    // Save to file
    await writeFile(PERSON_INFO_FILE, JSON.stringify(personInfo, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving person info:", error);
    return NextResponse.json(
      { error: "Failed to save person info" },
      { status: 500 }
    );
  }
}

