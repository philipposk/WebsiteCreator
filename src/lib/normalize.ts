import { type WebsiteInfo, type WebsiteSections } from "@/lib/types";

const defaultSections: WebsiteSections = {
  about: true,
  services: true,
  portfolio: false,
  reviews: true,
  technicians: false,
  booking: true,
  blog: false,
  shop: false,
};

const defaults: WebsiteInfo = {
  name: "",
  description: "",
  tagline: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  primaryColor: "#6a5bff",
  fontFamily: "System",
  template: "advanced",
  sections: defaultSections,
  services: [],
  reviews: [],
  portfolio: [],
  team: [],
  blog: [],
  products: [],
  logoUrl: "",
  ogImageUrl: "",
  slug: "",
};

export function normalizeWebsiteInfo(
  info: Partial<WebsiteInfo> | null | undefined
): WebsiteInfo {
  return {
    ...defaults,
    ...(info || {}),
    sections: { ...defaultSections, ...((info?.sections as Partial<WebsiteSections>) || {}) },
    services: Array.isArray(info?.services) ? info.services : [],
    reviews: Array.isArray(info?.reviews) ? info.reviews : [],
    portfolio: Array.isArray(info?.portfolio) ? info.portfolio : [],
    team: Array.isArray(info?.team) ? info.team : [],
    blog: Array.isArray(info?.blog) ? info.blog : [],
    products: Array.isArray(info?.products) ? info.products : [],
  };
}
