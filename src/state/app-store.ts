import { create } from "zustand";
import {
  type Website,
  type WebsiteInfo,
  type WebsiteSections,
  type Service,
  type Review,
  type PortfolioItem,
  type TeamMember,
  type BlogPost,
  type Product,
  type PublishedSite,
} from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { normalizeWebsiteInfo } from "@/lib/normalize";

type ContentKey = "services" | "reviews" | "portfolio" | "team" | "blog" | "products";
type ContentItem = Service | Review | PortfolioItem | TeamMember | BlogPost | Product;

type AppStore = {
  // Current website being edited
  currentWebsiteId: string | null;
  websites: Website[];

  // Website form data
  websiteInfo: WebsiteInfo;
  generatedHTML: string;
  isGenerating: boolean;

  // Undo/redo history (snapshots of websiteInfo)
  past: WebsiteInfo[];
  future: WebsiteInfo[];

  // Actions
  setWebsiteInfo: (info: Partial<WebsiteInfo>) => void;
  setWebsiteSections: (sections: Partial<WebsiteSections>) => void;
  addContentItem: <K extends ContentKey>(key: K, item: WebsiteInfo[K][number]) => void;
  updateContentItem: <K extends ContentKey>(key: K, id: string, patch: Partial<WebsiteInfo[K][number]>) => void;
  removeContentItem: (key: ContentKey, id: string) => void;
  replaceContent: (patch: Partial<Pick<WebsiteInfo, ContentKey>>) => void;
  setGeneratedHTML: (html: string) => void;
  setIsGenerating: (value: boolean) => void;
  saveWebsite: () => string | null;
  markPublished: (websiteId: string, published: PublishedSite) => void;
  loadWebsite: (websiteId: string) => void;
  deleteWebsite: (websiteId: string) => void;
  newWebsite: () => void;
  reset: () => void;
  // Undo/redo
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
};

const STORAGE_KEY = "website-creator-websites";

// Load websites from localStorage
const loadWebsitesFromStorage = (): Website[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading websites from storage:", error);
  }
  return [];
};

// Save websites to localStorage
const saveWebsitesToStorage = (websites: Website[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(websites));
  } catch (error) {
    console.error("Error saving websites to storage:", error);
  }
};

// Default website info
const defaultWebsiteInfo: WebsiteInfo = normalizeWebsiteInfo({});

// Save settings to API
const saveSettingsToAPI = async (settings: {
  websites: Website[];
  currentWebsiteId: string | null;
  websiteInfo: WebsiteInfo;
}) => {
  if (typeof window === "undefined") return;
  
  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ settings }),
    });
    
    if (!response.ok) {
      console.error("Error saving settings to API:", response.status, response.statusText);
      return;
    }
  } catch (error) {
    console.error("Error saving settings to API:", error);
  }
};

// Load settings from API
const loadSettingsFromAPI = async (): Promise<{
  websites: Website[] | null;
  currentWebsiteId: string | null;
  websiteInfo: WebsiteInfo | null;
} | null> => {
  if (typeof window === "undefined") return null;
  
  try {
    const response = await fetch("/api/settings?" + Date.now(), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      return null;
    }
    
    const data = await response.json();
    if (data.settings) {
      return data.settings;
    }
    return null;
  } catch (error) {
    console.error("Error loading settings from API:", error);
    return null;
  }
};

// Debounced save settings to API
let settingsSaveTimeout: NodeJS.Timeout | null = null;
const debouncedSaveSettings = (getState: () => AppStore, delay: number = 500) => {
  if (settingsSaveTimeout) {
    clearTimeout(settingsSaveTimeout);
  }
  settingsSaveTimeout = setTimeout(() => {
    const state = getState();
    saveSettingsToAPI({
      websites: state.websites,
      currentWebsiteId: state.currentWebsiteId,
      websiteInfo: state.websiteInfo,
    }).catch((error) => {
      console.error("Failed to save settings to API:", error);
    });
  }, delay);
};

// Debounced auto-save: whenever the user edits anything, upsert the current website
// into the websites list and push to the API. Skip until the website has a name.
let autoSaveTimeout: NodeJS.Timeout | null = null;
const autoSaveDraft = (getState: () => AppStore, delay: number = 800) => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    const state = getState();
    if (!state.websiteInfo.name.trim()) return;
    state.saveWebsite();
  }, delay);
};

const MAX_HISTORY = 20;

export const useAppStore = create<AppStore>((set, get) => ({
  currentWebsiteId: null,
  websites: loadWebsitesFromStorage(),
  websiteInfo: defaultWebsiteInfo,
  generatedHTML: "",
  isGenerating: false,
  past: [],
  future: [],
  
  setWebsiteInfo: (info) => {
    set((state) => ({
      websiteInfo: { ...state.websiteInfo, ...info },
    }));
    autoSaveDraft(get);
  },
  
  setWebsiteSections: (sections) => {
    set((state) => ({
      websiteInfo: {
        ...state.websiteInfo,
        sections: { ...state.websiteInfo.sections, ...sections },
      },
    }));
    autoSaveDraft(get);
  },

  addContentItem: (key, item) => {
    set((state) => {
      const list = (state.websiteInfo[key] as ContentItem[]) || [];
      return {
        websiteInfo: {
          ...state.websiteInfo,
          [key]: [...list, item],
        },
      };
    });
    autoSaveDraft(get);
  },

  updateContentItem: (key, id, patch) => {
    set((state) => {
      const list = (state.websiteInfo[key] as ContentItem[]) || [];
      return {
        websiteInfo: {
          ...state.websiteInfo,
          [key]: list.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        },
      };
    });
    autoSaveDraft(get);
  },

  removeContentItem: (key, id) => {
    set((state) => {
      const list = (state.websiteInfo[key] as ContentItem[]) || [];
      return {
        websiteInfo: {
          ...state.websiteInfo,
          [key]: list.filter((it) => it.id !== id),
        },
      };
    });
    autoSaveDraft(get);
  },

  replaceContent: (patch) => {
    set((state) => ({
      websiteInfo: { ...state.websiteInfo, ...patch },
    }));
    autoSaveDraft(get);
  },

  setGeneratedHTML: (html) =>
    set(() => ({
      generatedHTML: html,
    })),
  
  setIsGenerating: (value) =>
    set(() => ({
      isGenerating: value,
    })),
  
  saveWebsite: () => {
    const state = get();
    if (!state.websiteInfo.name.trim()) return null;

    const existing = state.currentWebsiteId
      ? state.websites.find((w) => w.id === state.currentWebsiteId)
      : undefined;

    const website: Website = {
      id: state.currentWebsiteId || crypto.randomUUID(),
      name: state.websiteInfo.name,
      info: state.websiteInfo,
      htmlCode: state.generatedHTML,
      createdAt: existing?.createdAt || nowIso(),
      updatedAt: nowIso(),
      published: existing?.published,
    };

    const existingIndex = state.websites.findIndex((w) => w.id === website.id);
    let updatedWebsites: Website[];

    if (existingIndex >= 0) {
      updatedWebsites = [...state.websites];
      updatedWebsites[existingIndex] = website;
    } else {
      updatedWebsites = [website, ...state.websites];
    }

    if (updatedWebsites.length > 50) {
      updatedWebsites = updatedWebsites.slice(0, 50);
    }

    saveWebsitesToStorage(updatedWebsites);
    set({
      websites: updatedWebsites,
      currentWebsiteId: website.id,
    });
    debouncedSaveSettings(get);
    return website.id;
  },

  markPublished: (websiteId, published) => {
    const state = get();
    const updated = state.websites.map((w) =>
      w.id === websiteId ? { ...w, published, updatedAt: nowIso() } : w
    );
    saveWebsitesToStorage(updated);
    set({ websites: updated });
    debouncedSaveSettings(get);
  },
  
  loadWebsite: (websiteId: string) => {
    const state = get();
    const website = state.websites.find((w) => w.id === websiteId);
    if (website) {
      set({
        currentWebsiteId: website.id,
        websiteInfo: normalizeWebsiteInfo(website.info),
        generatedHTML: website.htmlCode,
      });
    }
  },
  
  deleteWebsite: (websiteId: string) => {
    const state = get();
    const updatedWebsites = state.websites.filter((w) => w.id !== websiteId);
    saveWebsitesToStorage(updatedWebsites);
    
    if (state.currentWebsiteId === websiteId) {
      set({
        websites: updatedWebsites,
        currentWebsiteId: null,
        websiteInfo: defaultWebsiteInfo,
        generatedHTML: "",
      });
    } else {
      set({ websites: updatedWebsites });
    }
    debouncedSaveSettings(get);
  },
  
  newWebsite: () => {
    set({
      currentWebsiteId: null,
      websiteInfo: defaultWebsiteInfo,
      generatedHTML: "",
    });
  },
  
  reset: () =>
    set(() => ({
      currentWebsiteId: null,
      websites: [],
      websiteInfo: defaultWebsiteInfo,
      generatedHTML: "",
      isGenerating: false,
      past: [],
      future: [],
    })),

  pushSnapshot: () => {
    const state = get();
    const past = [...state.past, state.websiteInfo].slice(-MAX_HISTORY);
    set({ past, future: [] });
  },

  undo: () => {
    const { past, websiteInfo, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      websiteInfo: prev,
      future: [websiteInfo, ...future].slice(0, MAX_HISTORY),
    });
    autoSaveDraft(get);
  },

  redo: () => {
    const { past, websiteInfo, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      past: [...past, websiteInfo].slice(-MAX_HISTORY),
      websiteInfo: next,
      future: future.slice(1),
    });
    autoSaveDraft(get);
  },
}));

// Load from API first, then fallback to localStorage on client side
export const loadStoredSettings = async () => {
  if (typeof window === "undefined") return;
  
  try {
    const apiSettings = await loadSettingsFromAPI();
    
    if (apiSettings) {
      const updates: Partial<AppStore> = {};
      
      if (apiSettings.websites !== null && Array.isArray(apiSettings.websites)) {
        updates.websites = apiSettings.websites;
        saveWebsitesToStorage(apiSettings.websites);
      }
      
      if (apiSettings.currentWebsiteId !== null) {
        updates.currentWebsiteId = apiSettings.currentWebsiteId;
      }
      
      if (apiSettings.websiteInfo !== null) {
        updates.websiteInfo = normalizeWebsiteInfo(apiSettings.websiteInfo);
      }

      if (updates.websites) {
        updates.websites = updates.websites.map((w) => ({
          ...w,
          info: normalizeWebsiteInfo(w.info),
        }));
      }
      
      if (Object.keys(updates).length > 0) {
        useAppStore.setState(updates);
      }
      return;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  
  // Fallback to localStorage
  try {
    const websites = loadWebsitesFromStorage();
    if (websites.length > 0) {
      useAppStore.setState({ websites });
    }
  } catch (localStorageError) {
    console.error("Error loading settings from localStorage:", localStorageError);
  }
};
