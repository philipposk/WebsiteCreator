"use client";

import { useAppStore } from "@/state/app-store";
import { CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { key: "services", label: "Services", description: "Display your services" },
  { key: "portfolio", label: "Portfolio Gallery", description: "Showcase your work" },
  { key: "booking", label: "Online Booking", description: "Allow clients to book appointments" },
  { key: "reviews", label: "Client Reviews", description: "Show customer testimonials" },
  { key: "blog", label: "Blog", description: "Share news and updates" },
  { key: "shop", label: "Product Shop", description: "Sell products online" },
  { key: "games", label: "Games", description: "Interactive games section" },
  { key: "chatbot", label: "AI Chatbot", description: "AI-powered customer support" },
  { key: "forum", label: "Forum", description: "Community discussion forum" },
  { key: "about", label: "About Us", description: "Tell your story" },
  { key: "technicians", label: "Professionals", description: "Showcase your team" },
  { key: "adminDashboard", label: "Admin Dashboard", description: "Administrative tools" },
  { key: "statistics", label: "Statistics", description: "Display analytics" },
  { key: "giftCards", label: "Gift Cards", description: "Sell gift cards" },
  { key: "wallet", label: "Wallet", description: "Digital wallet feature" },
  { key: "membership", label: "Membership", description: "Membership programs" },
  { key: "waitlist", label: "Waitlist", description: "Waitlist management" },
  { key: "referral", label: "Referral Program", description: "Referral system" },
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
        Select which sections to include on your website
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

