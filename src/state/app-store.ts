import { create } from "zustand";
import { type Website, type WebsiteInfo, type WebsiteSections } from "@/lib/types";
import { nowIso } from "@/lib/utils";

type AppStore = {
  // Current website being edited
  currentWebsiteId: string | null;
  websites: Website[];
  
  // Website form data
  websiteInfo: WebsiteInfo;
  generatedHTML: string;
  isGenerating: boolean;
  
  // Actions
  setWebsiteInfo: (info: Partial<WebsiteInfo>) => void;
  setWebsiteSections: (sections: Partial<WebsiteSections>) => void;
  setGeneratedHTML: (html: string) => void;
  setIsGenerating: (value: boolean) => void;
  saveWebsite: () => void;
  loadWebsite: (websiteId: string) => void;
  deleteWebsite: (websiteId: string) => void;
  newWebsite: () => void;
  reset: () => void;
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
const defaultWebsiteInfo: WebsiteInfo = {
  name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  primaryColor: "#6a5bff",
  fontFamily: "System",
  template: "simple",
  sections: {
    services: true,
    portfolio: true,
    booking: true,
    reviews: true,
    blog: true,
    shop: true,
    games: true,
    chatbot: true,
    forum: true,
    about: true,
    technicians: true,
    adminDashboard: true,
    statistics: true,
    giftCards: true,
    wallet: true,
    membership: true,
    waitlist: true,
    referral: true,
  },
};

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

export const useAppStore = create<AppStore>((set, get) => ({
  currentWebsiteId: null,
  websites: loadWebsitesFromStorage(),
  websiteInfo: defaultWebsiteInfo,
  generatedHTML: "",
  isGenerating: false,
  
  setWebsiteInfo: (info) =>
    set((state) => ({
      websiteInfo: { ...state.websiteInfo, ...info },
    })),
  
  setWebsiteSections: (sections) =>
    set((state) => ({
      websiteInfo: {
        ...state.websiteInfo,
        sections: { ...state.websiteInfo.sections, ...sections },
      },
    })),
  
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
    if (!state.websiteInfo.name.trim()) return;
    
    const website: Website = {
      id: state.currentWebsiteId || crypto.randomUUID(),
      name: state.websiteInfo.name,
      info: state.websiteInfo,
      htmlCode: state.generatedHTML,
      createdAt: state.currentWebsiteId
        ? state.websites.find((w) => w.id === state.currentWebsiteId)?.createdAt || nowIso()
        : nowIso(),
      updatedAt: nowIso(),
    };
    
    const existingIndex = state.websites.findIndex((w) => w.id === website.id);
    let updatedWebsites: Website[];
    
    if (existingIndex >= 0) {
      updatedWebsites = [...state.websites];
      updatedWebsites[existingIndex] = website;
    } else {
      updatedWebsites = [website, ...state.websites];
    }
    
    // Keep only last 50 websites
    if (updatedWebsites.length > 50) {
      updatedWebsites = updatedWebsites.slice(0, 50);
    }
    
    saveWebsitesToStorage(updatedWebsites);
    set({
      websites: updatedWebsites,
      currentWebsiteId: website.id,
    });
    debouncedSaveSettings(get);
  },
  
  loadWebsite: (websiteId: string) => {
    const state = get();
    const website = state.websites.find((w) => w.id === websiteId);
    if (website) {
      set({
        currentWebsiteId: website.id,
        websiteInfo: website.info,
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
    })),
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
        updates.websiteInfo = apiSettings.websiteInfo;
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
