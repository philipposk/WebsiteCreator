"use client";

import { useAppStore } from "@/state/app-store";
import { CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { key: "about", label: "About", description: "Tell visitors who you are" },
  { key: "services", label: "Services", description: "List what you offer (price optional)" },
  { key: "portfolio", label: "Portfolio", description: "Gallery of past work, with images" },
  { key: "reviews", label: "Reviews", description: "Real customer testimonials with star ratings" },
  { key: "technicians", label: "Team", description: "Showcase team members with photo + role" },
  { key: "booking", label: "Booking CTA", description: "Call-to-action block prompting users to contact you" },
  { key: "blog", label: "Blog", description: "Recent posts/news (title + excerpt)" },
  { key: "shop", label: "Shop", description: "Product list with prices" },
] as const;

export const WebsiteSections = () => {
  const websiteInfo = useAppStore((state) => state.websiteInfo);
  const setWebsiteSections = useAppStore((state) => state.setWebsiteSections);
  const isGenerating = useAppStore((state) => state.isGenerating);

  const toggleSection = (key: keyof typeof websiteInfo.sections) => {
    if (isGenerating) return;
    setWebsiteSections({ [key]: !websiteInfo.sections[key] });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Include Sections</h2>
      <p className="mb-6 text-sm text-white/60">
        Toggle which sections appear on your site. Add real content for each enabled section in the &ldquo;Content&rdquo; tab.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sections.map((section) => {
          const isEnabled = websiteInfo.sections[section.key as keyof typeof websiteInfo.sections];
          return (
            <button
              key={section.key}
              onClick={() => toggleSection(section.key as keyof typeof websiteInfo.sections)}
              disabled={isGenerating}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition",
                isEnabled
                  ? "border-accent/50 bg-accent/10 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isEnabled ? (
                <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              ) : (
                <Square className="mt-0.5 h-5 w-5 shrink-0 text-white/40" />
              )}
              <div className="flex-1">
                <div className="font-medium">{section.label}</div>
                <div className="mt-1 text-sm text-white/60">{section.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
