export type WebsiteTemplate = "simple" | "advanced";

export type Service = {
  id: string;
  title: string;
  description: string;
  price?: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  date?: string;
  excerpt: string;
};

export type Product = {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl?: string;
};

export type WebsiteSections = {
  about: boolean;
  services: boolean;
  portfolio: boolean;
  reviews: boolean;
  technicians: boolean;
  booking: boolean;
  blog: boolean;
  shop: boolean;
};

export type WebsiteInfo = {
  name: string;
  description: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  primaryColor: string;
  fontFamily: string;
  template: WebsiteTemplate;
  sections: WebsiteSections;
  services: Service[];
  reviews: Review[];
  portfolio: PortfolioItem[];
  team: TeamMember[];
  blog: BlogPost[];
  products: Product[];
  logoUrl?: string;
  ogImageUrl?: string;
  slug?: string;
};

export type PublishedSite = {
  slug: string;
  url: string;
  publishedAt: string;
};

export type Website = {
  id: string;
  name: string;
  info: WebsiteInfo;
  htmlCode: string;
  createdAt: string;
  updatedAt: string;
  published?: PublishedSite;
};

export type ContactSubmission = {
  id: string;
  siteId: string;
  name: string;
  email: string;
  message: string;
  receivedAt: string;
};
