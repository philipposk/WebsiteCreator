"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Clock, User, Trash2, Pencil, FileText, Check, X, Globe } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { cn } from "@/lib/utils";

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const websites = useAppStore((state) => state.websites);
  const currentWebsiteId = useAppStore((state) => state.currentWebsiteId);
  const loadWebsite = useAppStore((state) => state.loadWebsite);
  const deleteWebsite = useAppStore((state) => state.deleteWebsite);
  const newWebsite = useAppStore((state) => state.newWebsite);
  
  const [hoveredWebsiteId, setHoveredWebsiteId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showMenuWebsiteId, setShowMenuWebsiteId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleNewWebsite = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    newWebsite();
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleWebsiteClick = (websiteId: string) => {
    loadWebsite(websiteId);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleDeleteWebsite = (e: React.MouseEvent, websiteId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this website?")) {
      deleteWebsite(websiteId);
      setShowMenuWebsiteId(null);
    }
  };

  const handleEditWebsite = (e: React.MouseEvent, websiteId: string) => {
    e.stopPropagation();
    const website = websites.find((w) => w.id === websiteId);
    if (website) {
      setEditingWebsiteId(websiteId);
      setRenameValue(website.name);
      setShowMenuWebsiteId(null);
    }
  };

  const handleRenameSave = (websiteId: string) => {
    if (renameValue.trim()) {
      const website = websites.find((w) => w.id === websiteId);
      if (website) {
        // Update website name in store
        const updatedWebsites = websites.map((w) =>
          w.id === websiteId ? { ...w, name: renameValue.trim() } : w
        );
        useAppStore.setState({ websites: updatedWebsites });
      }
    }
    setEditingWebsiteId(null);
    setRenameValue("");
  };

  const handleRenameCancel = () => {
    setEditingWebsiteId(null);
    setRenameValue("");
  };

  const handleExportWebsite = (websiteId: string) => {
    const website = websites.find((w) => w.id === websiteId);
    if (!website || !website.htmlCode) {
      alert("No website code to export");
      return;
    }

    const blob = new Blob([website.htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${website.name.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenuWebsiteId(null);
  };

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingWebsiteId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingWebsiteId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuWebsiteId(null);
      }
    };

    if (showMenuWebsiteId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenuWebsiteId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get first letter of app name for logo
  const logoLetter = "W";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/5 bg-black/40 lg:bg-black/40 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-white/5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-white font-calligraphic"
          style={{
            fontFamily: 'var(--font-kalam), cursive',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            paddingTop: '1px',
            paddingLeft: '0.5px'
          }}
        >
          {logoLetter}
        </div>
      </div>

      {/* New Website Button */}
      <div className="border-b border-white/5 p-3 space-y-2">
        <button
          type="button"
          onClick={handleNewWebsite}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          <span>New Website</span>
        </button>
      </div>

      {/* Website History */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium uppercase tracking-wider text-white/40">
          <Clock className="h-3 w-3" />
          <span>Websites</span>
        </div>
        {!isMounted ? (
          <p className="px-2 text-xs text-white/40">No websites</p>
        ) : websites.length > 0 ? (
          <div className="space-y-1">
            {websites.map((website) => {
              const isActive = website.id === currentWebsiteId;
              const isHovered = hoveredWebsiteId === website.id;
              return (
                <div
                  key={website.id}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                  onMouseEnter={() => setHoveredWebsiteId(website.id)}
                  onMouseLeave={() => setHoveredWebsiteId(null)}
                >
                  {editingWebsiteId === website.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameSave(website.id);
                          } else if (e.key === "Escape") {
                            handleRenameCancel();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white/10 text-sm text-white focus:text-white focus:outline-none border border-white/20 rounded px-2 py-1"
                        placeholder="Website name"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSave(website.id);
                        }}
                        className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                        aria-label="Save"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameCancel();
                        }}
                        className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                        aria-label="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleWebsiteClick(website.id)}
                        className="flex-1 text-left truncate flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{website.name}</div>
                          <div className="text-xs text-white/40">{formatDate(website.updatedAt)}</div>
                        </div>
                      </button>
                      {(isHovered || isActive) && (
                        <div className="relative flex items-center gap-1" ref={menuRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuWebsiteId(showMenuWebsiteId === website.id ? null : website.id);
                            }}
                            className="flex items-center justify-center rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                            aria-label="Website options"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {showMenuWebsiteId === website.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl z-50">
                              <div className="p-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditWebsite(e, website.id);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
                                >
                                  <Pencil className="h-3 w-3" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportWebsite(website.id);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Export</span>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteWebsite(e, website.id)}
                                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-rose-400 transition hover:bg-white/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-2 text-xs text-white/40">No websites yet</p>
        )}
      </div>

      {/* User Profile */}
      <div className="border-t border-white/5 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">User</p>
            <p className="text-xs text-white/40">Free Plan</p>
          </div>
        </button>
      </div>
    </aside>
  );
};
