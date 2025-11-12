"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/state/app-store";
import { WebsiteBuilderForm } from "./website-builder-form";
import { WebsiteSections } from "./website-sections";
import { WebsitePreview } from "./website-preview";
import { Sparkles, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const WebsiteBuilderPanel = () => {
  const websiteInfo = useAppStore((state) => state.websiteInfo);
  const generatedHTML = useAppStore((state) => state.generatedHTML);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const setGeneratedHTML = useAppStore((state) => state.setGeneratedHTML);
  const setIsGenerating = useAppStore((state) => state.setIsGenerating);
  const saveWebsite = useAppStore((state) => state.saveWebsite);
  
  const [activeTab, setActiveTab] = useState<"form" | "sections" | "preview">("form");
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleGenerate = async () => {
    if (!websiteInfo.name.trim()) {
      setError("Please enter a website name");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/website/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteInfo }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate website");
      }

      const data = await response.json();
      setGeneratedHTML(data.html);
      setActiveTab("preview");
      
      // Auto-save after generation
      setTimeout(() => {
        saveWebsite();
      }, 500);
    } catch (err: any) {
      console.error("Error generating website:", err);
      setError(err.message || "Failed to generate website");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Website Creator</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("form")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                activeTab === "form"
                  ? "bg-accent/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              Form
            </button>
            <button
              onClick={() => setActiveTab("sections")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                activeTab === "sections"
                  ? "bg-accent/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                activeTab === "preview"
                  ? "bg-accent/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              Preview
            </button>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !websiteInfo.name.trim()}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Website
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between border-b border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 rounded p-1 hover:bg-red-500/20 transition"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "form" && <WebsiteBuilderForm />}
        {activeTab === "sections" && (
          <div className="flex h-full flex-col overflow-y-auto bg-[#1a1a1a] p-6">
            <div className="mx-auto w-full max-w-4xl">
              <WebsiteSections />
            </div>
          </div>
        )}
        {activeTab === "preview" && <WebsitePreview />}
      </div>
    </div>
  );
};

