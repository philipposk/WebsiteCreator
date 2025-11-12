export type WebsiteTemplate = "simple" | "advanced";

export type WebsiteSections = {
  services: boolean;
  portfolio: boolean;
  booking: boolean;
  reviews: boolean;
  blog: boolean;
  shop: boolean;
  games: boolean;
  chatbot: boolean;
  forum: boolean;
  about: boolean;
  technicians: boolean;
  adminDashboard: boolean;
  statistics: boolean;
  giftCards: boolean;
  wallet: boolean;
  membership: boolean;
  waitlist: boolean;
  referral: boolean;
};

export type WebsiteInfo = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  primaryColor: string;
  fontFamily: string;
  template: WebsiteTemplate;
  sections: WebsiteSections;
};

export type Website = {
  id: string;
  name: string;
  info: WebsiteInfo;
  htmlCode: string;
  createdAt: string;
  updatedAt: string;
};
