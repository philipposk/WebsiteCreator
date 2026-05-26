// Build a ZIP archive of a generated site with image assets best-effort
// downloaded and rewritten to relative paths.
//
// Constraints:
// - Runs in the browser, so we can only fetch CORS-friendly URLs (Vercel Blob
//   serves Access-Control-Allow-Origin: * for public blobs, so our own uploads
//   work; user-pasted third-party URLs may fail and are kept as absolute links).

import JSZip from "jszip";

type ImageMap = Map<string, string>; // original URL -> local zip path

function extractImageUrls(html: string): string[] {
  const urls = new Set<string>();
  const patterns = [
    /<img[^>]+src="([^"]+)"/gi,
    /<link[^>]+rel="icon"[^>]+href="([^"]+)"/gi,
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi,
    /background:\s*url\(["']?([^"')]+)/gi,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(html)) !== null) {
      const url = m[1];
      if (url.startsWith("http://") || url.startsWith("https://")) urls.add(url);
    }
  }
  return [...urls];
}

function localPathFor(url: string, index: number): string {
  try {
    const u = new URL(url);
    const tail = u.pathname.split("/").pop() || `image-${index}`;
    return `assets/${index}-${tail}`;
  } catch {
    return `assets/image-${index}`;
  }
}

async function tryFetch(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

function rewriteHtml(html: string, map: ImageMap): string {
  let out = html;
  for (const [orig, local] of map.entries()) {
    const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "g");
    out = out.replace(re, local);
  }
  return out;
}

export async function buildSiteZip(opts: {
  html: string;
  filenameBase: string;
}): Promise<Blob> {
  const zip = new JSZip();
  const urls = extractImageUrls(opts.html);
  const map: ImageMap = new Map();

  const fetches = urls.map(async (url, i) => {
    const blob = await tryFetch(url);
    if (!blob) return; // skip — keep absolute URL in HTML
    const local = localPathFor(url, i + 1);
    map.set(url, local);
    zip.file(local, blob);
  });
  await Promise.all(fetches);

  const html = rewriteHtml(opts.html, map);
  zip.file("index.html", html);
  zip.file(
    "README.txt",
    `Static export of ${opts.filenameBase}.\nOpen index.html in a browser, or upload everything to any static host.\n`
  );

  return zip.generateAsync({ type: "blob" });
}
