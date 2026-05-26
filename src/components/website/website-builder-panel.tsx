"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAppStore } from "@/state/app-store";
import { WebsiteBuilderForm } from "./website-builder-form";
import { WebsiteSections } from "./website-sections";
import { WebsitePreview } from "./website-preview";
import { ContentEditor } from "./content-editor";
import { ChatPanel } from "./chat-panel";
import {
  Loader2,
  X,
  Wand2,
  Globe,
  ExternalLink,
  Copy,
  LogIn,
  AlertTriangle,
  RotateCcw,
  RotateCw,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "form" | "sections" | "content" | "chat" | "preview";

type Health = {
  blob: boolean;
  groq: boolean;
  auth: boolean;
  email: boolean;
};

export const WebsiteBuilderPanel = () => {
  const websiteInfo = useAppStore((s) => s.websiteInfo);
  const currentWebsiteId = useAppStore((s) => s.currentWebsiteId);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const saveWebsite = useAppStore((s) => s.saveWebsite);
  const markPublished = useAppStore((s) => s.markPublished);
  const setWebsiteInfo = useAppStore((s) => s.setWebsiteInfo);
  const replaceContent = useAppStore((s) => s.replaceContent);
  const websites = useAppStore((s) => s.websites);

  const current = websites.find((w) => w.id === currentWebsiteId);

  const past = useAppStore((s) => s.past);
  const future = useAppStore((s) => s.future);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const pushSnapshot = useAppStore((s) => s.pushSnapshot);

  const [activeTab, setActiveTab] = useState<Tab>("form");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAIFill, setShowAIFill] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiBusy, setAIBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  // Load view count when published site changes
  useEffect(() => {
    if (!currentWebsiteId || !current?.published) {
      setViews(null);
      return;
    }
    fetch(`/api/analytics?site=${encodeURIComponent(currentWebsiteId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setViews(data.views ?? 0))
      .catch(() => setViews(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWebsiteId, current?.published?.publishedAt]);

  // Keyboard shortcuts: Cmd+Z = undo, Cmd+Shift+Z = redo
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        if (past.length > 0) {
          e.preventDefault();
          undo();
        }
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        if (future.length > 0) {
          e.preventDefault();
          redo();
        }
      }
    },
    [past, future, undo, redo]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleAIFill = async () => {
    if (!aiPrompt.trim()) return;
    setAIBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/website/ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, current: websiteInfo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI fill failed");
      }
      const data = await res.json();
      const s = data.suggestion as Partial<typeof websiteInfo>;
      pushSnapshot();
      const scalarPatch: Partial<typeof websiteInfo> = {};
      (["name", "description", "tagline", "phone", "email", "address"] as const).forEach((k) => {
        if (typeof s[k] === "string" && s[k]) scalarPatch[k] = s[k] as string;
      });
      if (Object.keys(scalarPatch).length) setWebsiteInfo(scalarPatch);
      replaceContent({
        ...(Array.isArray(s.services) ? { services: s.services } : {}),
        ...(Array.isArray(s.reviews) ? { reviews: s.reviews } : {}),
        ...(Array.isArray(s.portfolio) ? { portfolio: s.portfolio } : {}),
        ...(Array.isArray(s.team) ? { team: s.team } : {}),
        ...(Array.isArray(s.blog) ? { blog: s.blog } : {}),
        ...(Array.isArray(s.products) ? { products: s.products } : {}),
      });
      setShowAIFill(false);
      setAIPrompt("");
      setActiveTab("content");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI fill failed";
      setError(msg);
    } finally {
      setAIBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!websiteInfo.name.trim()) {
      setError("Please enter a website name in the Basics tab first.");
      setActiveTab("form");
      return;
    }
    setError(null);
    setPublishBusy(true);
    setIsGenerating(true);
    try {
      const id = saveWebsite();
      if (!id) throw new Error("Could not save the draft");
      const res = await fetch("/api/website/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId: id,
          websiteInfo,
          desiredSlug: websiteInfo.slug || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Publish failed (${res.status})`);
      }
      const data = (await res.json()) as {
        slug: string;
        url: string;
        publishedAt: string;
      };
      markPublished(id, { slug: data.slug, url: data.url, publishedAt: data.publishedAt });
      setNotice(`Published at ${data.url}`);
      setActiveTab("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      setError(msg);
    } finally {
      setPublishBusy(false);
      setIsGenerating(false);
    }
  };

  const copyPublishedUrl = async () => {
    if (!current?.published?.url) return;
    try {
      await navigator.clipboard.writeText(current.published.url);
      setNotice("Link copied to clipboard.");
    } catch {
      setNotice("Could not copy. URL: " + current.published.url);
    }
  };

  const tab = (id: Tab, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm transition",
        activeTab === id
          ? "bg-accent/20 text-white"
          : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );

  const blobMissing = health && !health.blob;
  const groqMissing = health && !health.groq;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Website Creator</h1>
          <div className="flex gap-2">
            {tab("form", "Basics")}
            {tab("sections", "Sections")}
            {tab("content", "Content")}
            {tab("chat", "AI Chat")}
            {tab("preview", "Preview")}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {health?.auth && (
            <Link
              href="/api/auth/signin"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (⌘Z)"
            className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (⌘⇧Z)"
            className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAIFill((v) => !v)}
            disabled={isGenerating || groqMissing === true}
            title={groqMissing ? "GROQ_API_KEY not configured" : ""}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            AI Fill
          </button>
          <button
            onClick={handlePublish}
            disabled={publishBusy || !websiteInfo.name.trim() || blobMissing === true}
            title={blobMissing ? "BLOB_READ_WRITE_TOKEN not configured" : ""}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : current?.published ? (
              <>
                <Globe className="h-4 w-4" />
                Re-publish
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Publish
              </>
            )}
          </button>
        </div>
      </div>

      {current?.published && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="h-4 w-4" />
            <span>Live at</span>
            <a
              href={current.published.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline-offset-2 hover:underline"
            >
              {current.published.url}
            </a>
            {views !== null && (
              <span className="flex items-center gap-1 text-xs text-emerald-300/70">
                <BarChart2 className="h-3 w-3" />
                {views.toLocaleString()} view{views !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyPublishedUrl}
              className="flex items-center gap-1.5 rounded-md border border-emerald-400/40 px-2 py-1 text-xs transition hover:bg-emerald-500/20"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <a
              href={current.published.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-emerald-400/40 px-2 py-1 text-xs transition hover:bg-emerald-500/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
        </div>
      )}

      {(blobMissing || groqMissing) && (
        <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {blobMissing && (
              <p>
                <strong>Publishing disabled:</strong> set <code>BLOB_READ_WRITE_TOKEN</code> in
                your Vercel project env to enable publish + saved drafts.
              </p>
            )}
            {groqMissing && (
              <p>
                <strong>AI Fill disabled:</strong> set <code>GROQ_API_KEY</code> in your env to
                draft content from a prompt.
              </p>
            )}
          </div>
        </div>
      )}

      {showAIFill && (
        <div className="border-b border-white/10 bg-black/40 px-4 py-3">
          <label className="mb-1 block text-xs font-medium text-white/70">
            Describe your business — AI will draft name, services, reviews and team
          </label>
          <div className="flex flex-wrap items-stretch gap-2">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="e.g. 'Cozy neighborhood hair salon in Brooklyn, 3 stylists, specializes in curls'"
              rows={2}
              className="flex-1 min-w-[280px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleAIFill}
              disabled={aiBusy || !aiPrompt.trim()}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {aiBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Drafting…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Draft content
                </>
              )}
            </button>
          </div>
        </div>
      )}

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

      {notice && (
        <div className="flex items-center justify-between border-b border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="ml-4 rounded p-1 hover:bg-sky-500/20 transition"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "form" && <WebsiteBuilderForm />}
        {activeTab === "sections" && (
          <div className="flex h-full w-full flex-col overflow-y-auto bg-[#1a1a1a] p-6">
            <div className="mx-auto w-full max-w-4xl">
              <WebsiteSections />
            </div>
          </div>
        )}
        {activeTab === "content" && <ContentEditor />}
        {activeTab === "chat" && <ChatPanel />}
        {activeTab === "preview" && <WebsitePreview />}
      </div>
    </div>
  );
};
