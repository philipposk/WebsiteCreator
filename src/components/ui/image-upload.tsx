"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string | undefined;
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export const ImageUpload = ({ value, onChange, label, disabled, className }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) throw new Error("Upload returned no URL");
      onChange(data.url);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-xs font-medium text-white/70">{label}</label>
      )}
      <div className="flex items-stretch gap-2">
        {value ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-white/15 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled}
              className="absolute right-0 top-0 rounded-bl bg-black/70 p-0.5 text-white hover:bg-red-500/80"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || busy}
          placeholder="https://… or upload a file"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || busy}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading" : "Upload"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
};
