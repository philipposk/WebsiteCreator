"use client";

import { useAppStore } from "@/state/app-store";
import { presets, type Preset } from "@/lib/presets";
import { cn } from "@/lib/utils";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// Apply IDs to any seeded content arrays so the store's CRUD still works.
function withIds<T extends { id: string }>(arr: T[] | undefined): T[] {
  return (arr ?? []).map((it) => ({ ...it, id: uid() }));
}

type Props = {
  onPick?: (preset: Preset) => void;
};

export const PresetGallery = ({ onPick }: Props) => {
  const setWebsiteInfo = useAppStore((s) => s.setWebsiteInfo);
  const replaceContent = useAppStore((s) => s.replaceContent);
  const current = useAppStore((s) => s.websiteInfo);

  const apply = (preset: Preset) => {
    const seed = preset.seed();
    const scalars: Partial<typeof current> = {};
    (
      ["tagline", "description", "primaryColor", "fontFamily", "template"] as const
    ).forEach((k) => {
      const v = (seed as Record<string, unknown>)[k];
      if (typeof v === "string") (scalars as Record<string, unknown>)[k] = v;
    });
    if (seed.sections) scalars.sections = { ...current.sections, ...seed.sections };
    if (Object.keys(scalars).length) setWebsiteInfo(scalars);

    replaceContent({
      services: withIds(seed.services),
      reviews: withIds(seed.reviews),
      portfolio: withIds(seed.portfolio),
      team: withIds(seed.team),
      blog: withIds(seed.blog),
      products: withIds(seed.products),
    });

    onPick?.(preset);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="mb-2 text-lg font-semibold text-white">Start from a template</h2>
      <p className="mb-4 text-sm text-white/60">
        Pick an industry to pre-fill services, sample reviews, and a colour palette. You can
        edit everything afterwards. Picking a template replaces existing content lists.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => apply(p)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-lg border border-white/10 bg-black/20 p-4 text-left transition hover:border-accent/50 hover:bg-white/5"
            )}
          >
            <div className="text-2xl">{p.emoji}</div>
            <div className="font-semibold text-white">{p.label}</div>
            <div className="text-xs text-white/60">{p.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
