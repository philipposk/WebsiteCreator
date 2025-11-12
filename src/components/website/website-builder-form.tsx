"use client";

import { useState } from "react";
import { useAppStore } from "@/state/app-store";
import { type WebsiteTemplate } from "@/lib/types";
import { Palette, Type, Globe, Mail, Phone, MapPin, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const availableFonts = ["System", "Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana"];
const colorPresets = [
  "#6a5bff",
  "#007AFF",
  "#34C759",
  "#FF9500",
  "#FF3B30",
  "#AF52DE",
  "#FF2D92",
  "#5856D6",
];

export const WebsiteBuilderForm = () => {
  const websiteInfo = useAppStore((state) => state.websiteInfo);
  const setWebsiteInfo = useAppStore((state) => state.setWebsiteInfo);
  const isGenerating = useAppStore((state) => state.isGenerating);

  const handleInputChange = (field: keyof typeof websiteInfo, value: string) => {
    setWebsiteInfo({ [field]: value });
  };

  const handleTemplateChange = (template: WebsiteTemplate) => {
    setWebsiteInfo({ template });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#1a1a1a] p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Website Builder</h1>
          <p className="mt-2 text-white/60">Create and customize your website</p>
        </div>

        {/* Template Selection */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <FileText className="h-5 w-5" />
            Template
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTemplateChange("simple")}
              disabled={isGenerating}
              className={cn(
                "rounded-lg border-2 p-4 text-left transition",
                websiteInfo.template === "simple"
                  ? "border-accent bg-accent/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="font-semibold">Simple</div>
              <div className="mt-1 text-sm text-white/60">
                Basic HTML website with essential sections
              </div>
            </button>
            <button
              onClick={() => handleTemplateChange("advanced")}
              disabled={isGenerating}
              className={cn(
                "rounded-lg border-2 p-4 text-left transition",
                websiteInfo.template === "advanced"
                  ? "border-accent bg-accent/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="font-semibold">Advanced</div>
              <div className="mt-1 text-sm text-white/60">
                Full-featured website with modern design
              </div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Website Name *
              </label>
              <input
                type="text"
                value={websiteInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isGenerating}
                placeholder="Enter website name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Description
              </label>
              <textarea
                value={websiteInfo.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={isGenerating}
                placeholder="Enter website description"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Contact Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Phone className="h-4 w-4" />
                Phone
              </label>
              <input
                type="tel"
                value={websiteInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isGenerating}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <input
                type="email"
                value={websiteInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isGenerating}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              <input
                type="text"
                value={websiteInfo.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={isGenerating}
                placeholder="Enter address"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Globe className="h-4 w-4" />
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={websiteInfo.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                disabled={isGenerating}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Design Settings */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Palette className="h-5 w-5" />
            Design Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Primary Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={websiteInfo.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  disabled={isGenerating}
                  className="h-12 w-20 cursor-pointer rounded-lg border border-white/10 disabled:opacity-50"
                />
                <input
                  type="text"
                  value={websiteInfo.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  disabled={isGenerating}
                  placeholder="#6a5bff"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleInputChange("primaryColor", color)}
                    disabled={isGenerating}
                    className={cn(
                      "h-8 w-8 rounded-lg border-2 transition",
                      websiteInfo.primaryColor === color
                        ? "border-white scale-110"
                        : "border-white/20 hover:border-white/40",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Type className="h-4 w-4" />
                Font Family
              </label>
              <select
                value={websiteInfo.fontFamily}
                onChange={(e) => handleInputChange("fontFamily", e.target.value)}
                disabled={isGenerating}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-accent focus:outline-none disabled:opacity-50"
              >
                {availableFonts.map((font) => (
                  <option key={font} value={font} className="bg-[#1a1a1a]">
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

