"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/state/app-store";
import { Download, Eye, EyeOff, Smartphone, Tablet, Monitor, Loader2 } from "lucide-react";
import { buildHTML } from "@/lib/build-html";
import { cn } from "@/lib/utils";

type Device = "mobile" | "tablet" | "desktop";

const deviceWidth: Record<Device, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
};

export const WebsitePreview = () => {
  const websiteInfo = useAppStore((s) => s.websiteInfo);
  const currentWebsiteId = useAppStore((s) => s.currentWebsiteId);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const [showPreview, setShowPreview] = useState(true);
  const [device, setDevice] = useState<Device>("desktop");
  const debounceRef = useRef<number | undefined>(undefined);
  const [debouncedInfo, setDebouncedInfo] = useState(websiteInfo);

  // Debounce so heavy edits (e.g. typing in a textarea) don't re-render the iframe each keystroke.
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedInfo(websiteInfo), 200);
    return () => window.clearTimeout(debounceRef.current);
  }, [websiteInfo]);

  const html = useMemo(() => {
    if (!debouncedInfo.name?.trim()) return "";
    return buildHTML(debouncedInfo, { siteId: currentWebsiteId ?? undefined });
  }, [debouncedInfo, currentWebsiteId]);

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(debouncedInfo.slug || debouncedInfo.name || "website").toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const empty = !html;

  return (
    <div className="flex h-full w-full flex-col bg-[#1a1a1a]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide" : "Show"}
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
            {(["mobile", "tablet", "desktop"] as Device[]).map((d) => {
              const Icon = d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;
              return (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={cn(
                    "rounded-md p-1.5 text-white/70 transition",
                    device === d ? "bg-accent/30 text-white" : "hover:bg-white/10"
                  )}
                  aria-label={`${d} preview`}
                  title={`${d} preview`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Loader2 className="h-3 w-3 animate-spin" />
              Working…
            </div>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={empty}
          className="flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/20 px-3 py-1.5 text-sm text-white transition hover:bg-accent/30 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download HTML
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-black/40 p-4">
        {empty ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Eye className="mx-auto h-12 w-12 text-white/40" />
              <p className="mt-4 text-white/60">
                Enter a website name in the Basics tab to see a live preview.
              </p>
            </div>
          </div>
        ) : showPreview ? (
          <div className="mx-auto h-full" style={{ maxWidth: deviceWidth[device] }}>
            <iframe
              srcDoc={html}
              className="h-full w-full rounded-lg border border-white/10 bg-white"
              title="Website Preview"
              sandbox="allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EyeOff className="h-10 w-10 text-white/30" />
          </div>
        )}
      </div>
    </div>
  );
};
