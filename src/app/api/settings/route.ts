import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const SETTINGS_BLOB_KEY = "settings.json";

// Store the blob URL in memory after first save (will be lost on server restart, but that's okay)
let cachedBlobUrl: string | null = null;

export async function GET() {
  try {
    console.log("GET /api/settings - Starting to load settings from blob");
    
    // Try to list all blobs to find our settings
    try {
      const { blobs } = await list({
        limit: 100, // Get more blobs to find our settings
      });

      console.log(`Found ${blobs.length} blobs total`);
      
      // Find the exact match or any blob with "settings" in the name
      const settingsBlob = blobs.find(blob => {
        const path = blob.pathname || blob.url || "";
        return path === SETTINGS_BLOB_KEY || 
               path.includes("settings.json") ||
               path.endsWith("settings.json") ||
               path.includes("settings");
      });

      if (settingsBlob) {
        console.log("Found settings blob:", {
          pathname: settingsBlob.pathname,
          url: settingsBlob.url,
          size: settingsBlob.size,
        });
        cachedBlobUrl = settingsBlob.url;

        // Fetch the blob content
        const response = await fetch(settingsBlob.url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        
        if (!response.ok) {
          console.error("Failed to fetch blob content:", response.status, response.statusText);
          return NextResponse.json({ settings: null, error: `Failed to fetch: ${response.statusText}` });
        }

        const data = await response.text();
        console.log("Blob content length:", data.length);
        
        if (!data || data.trim().length === 0) {
          console.log("Blob content is empty");
          return NextResponse.json({ settings: null });
        }

        const settings = JSON.parse(data);
        console.log("Settings loaded from blob successfully:", {
          websitesCount: settings.websites?.length || 0,
          currentWebsiteId: settings.currentWebsiteId,
          hasWebsiteInfo: !!settings.websiteInfo,
        });
        return NextResponse.json({ settings });
      } else {
        console.log("No settings blob found in list. Available blobs:", blobs.map(b => b.pathname || b.url));
      }
    } catch (listError: any) {
      console.error("Error listing blobs:", {
        message: listError.message,
        stack: listError.stack,
        name: listError.name,
      });
    }

    // If we have a cached URL, try to use it
    if (cachedBlobUrl) {
      console.log("Trying cached blob URL:", cachedBlobUrl);
      try {
        const response = await fetch(cachedBlobUrl, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        
        if (response.ok) {
          const data = await response.text();
          const settings = JSON.parse(data);
          console.log("Settings loaded from cached blob URL");
          return NextResponse.json({ settings });
        } else {
          console.log("Cached URL failed:", response.status, response.statusText);
        }
      } catch (fetchError: any) {
        console.error("Failed to fetch from cached URL:", fetchError.message);
        cachedBlobUrl = null;
      }
    }

    console.log("No settings blob found - returning null");
    return NextResponse.json({ settings: null, message: "No settings found in blob storage" });
  } catch (error: any) {
    console.error("Error reading settings from blob:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({ 
      settings: null, 
      error: error.message || "Unknown error",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/settings - Starting to save settings to blob");
    
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: "No settings provided" },
        { status: 400 }
      );
    }

    console.log("Saving settings to blob...", {
      websitesCount: settings.websites?.length || 0,
      currentWebsiteId: settings.currentWebsiteId,
      hasWebsiteInfo: !!settings.websiteInfo,
    });

    // Convert settings to JSON string
    const settingsJson = JSON.stringify(settings, null, 2);
    console.log("Settings JSON size:", settingsJson.length, "bytes");
    
    const settingsBlob = new Blob([settingsJson], { type: "application/json" });

    console.log("Calling put() with key:", SETTINGS_BLOB_KEY);
    
    // Save to Vercel Blob
    // Using a consistent key - Vercel Blob will overwrite if the key already exists
    const blob = await put(SETTINGS_BLOB_KEY, settingsBlob, {
      access: "public",
      contentType: "application/json",
    });

    console.log("Settings saved to blob successfully:", {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    });
    
    // Cache the URL for faster retrieval
    cachedBlobUrl = blob.url;
    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      pathname: blob.pathname,
      message: "Settings saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving settings to blob:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    // Check if it's an authentication error
    if (error.message?.includes("token") || 
        error.message?.includes("unauthorized") || 
        error.message?.includes("401") ||
        error.message?.includes("403")) {
      console.error("Vercel Blob authentication error. Please check BLOB_READ_WRITE_TOKEN environment variable.");
      return NextResponse.json(
        { 
          error: "Blob storage not configured", 
          details: "Please set BLOB_READ_WRITE_TOKEN environment variable in Vercel.",
          message: error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to save settings", 
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

