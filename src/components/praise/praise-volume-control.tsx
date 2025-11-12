"use client";

import { Sparkles } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { useTranslation } from "@/lib/translations";
import { cn } from "@/lib/utils";

export const PraiseVolumeControl = () => {
  const praiseVolume = useAppStore((state) => state.praiseVolume);
  const setPraiseVolume = useAppStore((state) => state.setPraiseVolume);
  const uiLanguage = useAppStore((state) => state.uiLanguage);
  const t = useTranslation(uiLanguage);

  const getVolumeLabel = () => {
    if (praiseVolume === 0) return t.off;
    if (praiseVolume < 20) return t.whisper;
    if (praiseVolume < 40) return t.gentle;
    if (praiseVolume < 60) return t.moderate;
    if (praiseVolume < 80) return t.enthusiastic;
    return t.maximum;
  };

  const getVolumeColor = () => {
    if (praiseVolume === 0) return "text-white/40";
    if (praiseVolume < 20) return "text-blue-400";
    if (praiseVolume < 40) return "text-purple-400";
    if (praiseVolume < 60) return "text-pink-400";
    return "text-accent";
  };

  const getTrackColor = () => {
    if (praiseVolume === 0) return "bg-white/10";
    if (praiseVolume < 20) return "bg-blue-400/30";
    if (praiseVolume < 40) return "bg-purple-400/30";
    if (praiseVolume < 60) return "bg-pink-400/30";
    return "bg-accent/30";
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-[200px]">
      <div className="flex items-center gap-3 w-full">
        <Sparkles className={cn("h-4 w-4 shrink-0", praiseVolume === 0 ? "text-white/40" : getVolumeColor())} />
        
        <div className="flex-1 relative">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-200", getTrackColor())}
              style={{ width: `${praiseVolume}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={praiseVolume}
            onChange={(e) => setPraiseVolume(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="text-right min-w-[60px]">
          <span className={cn("text-xs font-semibold block", getVolumeColor())}>
            {praiseVolume}%
          </span>
        </div>
      </div>
      
      {/* Centered label text */}
      <div className="w-full flex justify-center">
        <p className={cn("text-[10px] font-medium", getVolumeColor())}>
          {getVolumeLabel()}
        </p>
      </div>
    </div>
  );
};
