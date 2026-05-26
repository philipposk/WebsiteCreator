"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Send, Wand2, Check, X, RotateCcw, Loader2 } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { type WebsiteInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";
type Message = {
  id: string;
  role: Role;
  content: string;
  patch?: Partial<WebsiteInfo> | null;
};

const STARTERS = [
  "Add 3 services for a hair salon",
  "Make the tone more professional",
  "Change the primary color to deep blue",
  "Write 2 five-star reviews",
  "Add a team section with 2 members",
];

export const ChatPanel = () => {
  const websiteInfo = useAppStore((s) => s.websiteInfo);
  const setWebsiteInfo = useAppStore((s) => s.setWebsiteInfo);
  const replaceContent = useAppStore((s) => s.replaceContent);
  const pushSnapshot = useAppStore((s) => s.pushSnapshot);
  const undo = useAppStore((s) => s.undo);
  const past = useAppStore((s) => s.past);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPatch, setPendingPatch] = useState<{
    msgId: string;
    patch: Partial<WebsiteInfo>;
    applied: boolean;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setError(null);
      setInput("");

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const history: Message[] = [...messages, userMsg];
      setMessages(history);
      setBusy(true);

      try {
        const res = await fetch("/api/website/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            current: websiteInfo,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Server error ${res.status}`);
        }

        const data = (await res.json()) as {
          reply: string;
          patch: Partial<WebsiteInfo> | null;
        };

        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          patch: data.patch,
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (data.patch && Object.keys(data.patch).length > 0) {
          setPendingPatch({ msgId: aiMsg.id, patch: data.patch, applied: false });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "AI error";
        setError(msg);
        // Remove the user message on error so they can retry
        setMessages(history.slice(0, -1));
        setInput(trimmed);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, websiteInfo]
  );

  const applyPatch = (patch: Partial<WebsiteInfo>) => {
    pushSnapshot();
    const scalarKeys = [
      "name", "tagline", "description", "phone", "email",
      "address", "primaryColor", "fontFamily",
    ] as const;
    const scalars: Partial<WebsiteInfo> = {};
    for (const k of scalarKeys) {
      if (k in patch && typeof patch[k] === "string") {
        (scalars as Record<string, unknown>)[k] = patch[k];
      }
    }
    if (Object.keys(scalars).length) setWebsiteInfo(scalars);

    const arrayKeys = ["services", "reviews", "portfolio", "team", "blog", "products"] as const;
    const arrays: Partial<Pick<WebsiteInfo, (typeof arrayKeys)[number]>> = {};
    for (const k of arrayKeys) {
      if (k in patch && Array.isArray(patch[k])) {
        (arrays as Record<string, unknown>)[k] = patch[k];
      }
    }
    if (Object.keys(arrays).length) replaceContent(arrays);

    setPendingPatch((p) => (p ? { ...p, applied: true } : null));
  };

  const discardPatch = () => {
    setPendingPatch((p) => (p ? { ...p, applied: true } : null));
  };

  const describeChanges = (patch: Partial<WebsiteInfo>): string => {
    const fields = Object.keys(patch);
    if (!fields.length) return "no changes";
    const labels: Record<string, string> = {
      name: "name",
      tagline: "tagline",
      description: "description",
      primaryColor: "color",
      fontFamily: "font",
      phone: "phone",
      email: "email",
      address: "address",
      services: "services",
      reviews: "reviews",
      portfolio: "portfolio",
      team: "team",
      blog: "blog",
      products: "products",
    };
    return fields.map((f) => labels[f] ?? f).join(", ");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col bg-[#111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Wand2 className="h-4 w-4 text-accent" />
          AI Chat
        </div>
        {past.length > 0 && (
          <button
            onClick={undo}
            title={`Undo (${past.length} steps available)`}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            Undo
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-accent/20 p-3">
              <Wand2 className="h-6 w-6 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Chat with your website</p>
              <p className="mt-1 text-xs text-white/50">
                Ask me to add content, change colors, write copy…
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-accent/20 hover:border-accent/40 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isPending =
            pendingPatch?.msgId === msg.id && !pendingPatch.applied && msg.patch;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold",
                  msg.role === "user"
                    ? "bg-accent/30 text-accent"
                    : "bg-white/10 text-white/70"
                )}
              >
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent/20 text-white rounded-tr-sm"
                    : "bg-white/8 text-white/90 rounded-tl-sm border border-white/8"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {isPending && pendingPatch && (
                  <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3">
                    <p className="text-xs text-accent font-medium mb-2">
                      Suggested changes: {describeChanges(pendingPatch.patch)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyPatch(pendingPatch.patch)}
                        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent/80"
                      >
                        <Check className="h-3 w-3" />
                        Apply
                      </button>
                      <button
                        onClick={discardPatch}
                        className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                {pendingPatch?.msgId === msg.id && pendingPatch.applied && msg.patch && (
                  <p className="mt-2 text-xs text-white/40">Changes applied ✓</p>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex gap-3">
            <div className="h-7 w-7 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">
              AI
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-white/8 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-accent/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to change something…"
            rows={1}
            disabled={busy}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => void send(input)}
            disabled={!input.trim() || busy}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition hover:bg-accent/80 disabled:opacity-40"
            aria-label="Send"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-white/25">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
