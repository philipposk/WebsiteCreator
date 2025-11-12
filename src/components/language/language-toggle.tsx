"use client";

import { Languages } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { cn } from "@/lib/utils";

export const LanguageToggle = () => {
  const uiLanguage = useAppStore((state) => state.uiLanguage);
  const setUiLanguage = useAppStore((state) => state.setUiLanguage);

  const toggleLanguage = () => {
    setUiLanguage(uiLanguage === "en" ? "el" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center justify-center rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white",
        "h-7 w-7"
      )}
      aria-label={uiLanguage === "en" ? "Switch to Greek" : "Switch to English"}
      title={uiLanguage === "en" ? "Switch to Greek" : "Switch to English"}
    >
      <Languages className="h-4 w-4" />
    </button>
  );
};

