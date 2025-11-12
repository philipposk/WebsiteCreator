"use client";

import { useAppStore } from "@/state/app-store";
import { Loader2, Download, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const WebsitePreview = () => {
  const generatedHTML = useAppStore((state) => state.generatedHTML);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const [showPreview, setShowPreview] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const handleDownload = () => {
    if (!generatedHTML) return;

    const blob = new Blob([generatedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `website-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Refresh iframe when HTML changes
  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  if (!generatedHTML && !isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#1a1a1a] p-6">
        <div className="text-center">
          <Eye className="mx-auto h-12 w-12 text-white/40" />
          <p className="mt-4 text-white/60">Generate a website to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#1a1a1a]">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Preview
              </>
            )}
          </button>
          <button
            onClick={handleRefresh}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
        {generatedHTML && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/20 px-3 py-1.5 text-sm text-white transition hover:bg-accent/30"
          >
            <Download className="h-4 w-4" />
            Download HTML
          </button>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {isGenerating ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
              <p className="mt-4 text-white/60">Generating website...</p>
            </div>
          </div>
        ) : showPreview && generatedHTML ? (
          <iframe
            key={iframeKey}
            srcDoc={generatedHTML}
            className="h-full w-full border-0"
            title="Website Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <EyeOff className="mx-auto h-12 w-12 text-white/40" />
              <p className="mt-4 text-white/60">Preview is hidden</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

