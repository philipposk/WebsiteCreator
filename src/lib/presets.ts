// Industry presets that seed a new draft with sensible defaults so the user
// doesn't start from a blank form. Each preset returns the *patch* to apply
// to the current websiteInfo — content arrays get IDs assigned by the caller.

import { type WebsiteInfo, type WebsiteSections } from "@/lib/types";

export type Preset = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  seed: () => Partial<WebsiteInfo>;
};

const sections = (overrides: Partial<WebsiteSections>): WebsiteSections => ({
  about: true,
  services: true,
  portfolio: false,
  reviews: true,
  technicians: false,
  booking: true,
  blog: false,
  shop: false,
  ...overrides,
});

export const presets: Preset[] = [
  {
    id: "salon",
    label: "Hair / beauty salon",
    emoji: "💇",
    description: "Service list with prices, team photos, client reviews.",
    seed: () => ({
      tagline: "Look great. Feel great. Book in seconds.",
      description:
        "We're a neighborhood salon focused on personal service, modern technique, and giving every client a look they love.",
      primaryColor: "#d946ef",
      sections: sections({ technicians: true, portfolio: true }),
      services: [
        { id: "", title: "Haircut & style", description: "Wash, cut and finish.", price: "$45" },
        { id: "", title: "Color (full)", description: "Single-process color refresh.", price: "From $90" },
        { id: "", title: "Balayage", description: "Hand-painted highlights, blended finish.", price: "From $180" },
        { id: "", title: "Blowout", description: "Wash and bouncy blowout.", price: "$35" },
      ],
      reviews: [
        { id: "", author: "Maria L.", rating: 5, text: "Best balayage I've had in years. Will be back." },
        { id: "", author: "Jen K.", rating: 5, text: "Friendly team and the cut held its shape all month." },
      ],
    }),
  },
  {
    id: "restaurant",
    label: "Restaurant / café",
    emoji: "🍽️",
    description: "Menu items, hours, location, photos of the food.",
    seed: () => ({
      tagline: "Honest food, neighborhood prices.",
      description:
        "A small kitchen run by people who love what they cook. Seasonal menu, local sourcing, no shortcuts.",
      primaryColor: "#ea580c",
      sections: sections({ portfolio: true, shop: false, booking: true }),
      services: [
        { id: "", title: "Brunch", description: "Sat–Sun 9am–2pm.", price: "" },
        { id: "", title: "Dinner", description: "Tue–Sun 5pm–10pm.", price: "" },
        { id: "", title: "Private events", description: "Up to 40 guests, full kitchen.", price: "By quote" },
      ],
      reviews: [
        { id: "", author: "Tom R.", rating: 5, text: "Best brunch in the neighborhood. Worth the wait." },
      ],
    }),
  },
  {
    id: "plumber",
    label: "Plumber / trades",
    emoji: "🔧",
    description: "Service area, emergency hours, quote request.",
    seed: () => ({
      tagline: "Fast, fair, fixed-right pricing.",
      description:
        "Family-run plumbing service. Same-day emergencies, transparent quotes, and a guarantee on every repair.",
      primaryColor: "#1d4ed8",
      sections: sections({ booking: true, reviews: true, technicians: true }),
      services: [
        { id: "", title: "Leak repair", description: "Diagnose and fix any visible leak.", price: "From $120" },
        { id: "", title: "Drain unclogging", description: "Camera inspection and clearing.", price: "From $180" },
        { id: "", title: "Water heater install", description: "Same-day install on most units.", price: "By quote" },
        { id: "", title: "24/7 emergency", description: "Out within the hour, citywide.", price: "Call for rate" },
      ],
      reviews: [
        { id: "", author: "Anna P.", rating: 5, text: "Came out within 40 minutes on a Sunday. Saved the day." },
      ],
    }),
  },
  {
    id: "consultant",
    label: "Consultant / freelancer",
    emoji: "💼",
    description: "Services, testimonials, contact form for inquiries.",
    seed: () => ({
      tagline: "Strategic clarity for early-stage teams.",
      description:
        "I help founders and small teams turn fuzzy goals into a 90-day plan they actually ship.",
      primaryColor: "#0f766e",
      sections: sections({ portfolio: true, blog: true }),
      services: [
        { id: "", title: "Strategy audit", description: "2-week deep dive with a written plan.", price: "From $4,500" },
        { id: "", title: "Fractional advisor", description: "Weekly hour with async support.", price: "$1,800/mo" },
        { id: "", title: "Workshop", description: "Half-day team workshop, in-person or remote.", price: "$2,500" },
      ],
      reviews: [
        { id: "", author: "Founder, Series A SaaS", rating: 5, text: "Three weeks of work that saved us three quarters." },
      ],
    }),
  },
  {
    id: "photographer",
    label: "Photographer",
    emoji: "📷",
    description: "Portfolio gallery, packages, booking request.",
    seed: () => ({
      tagline: "Honest portraits. Real moments.",
      description: "Documentary-style portrait and wedding photography across the region.",
      primaryColor: "#111827",
      sections: sections({ portfolio: true, services: true, blog: false, technicians: false }),
      portfolio: [
        { id: "", title: "Spring weddings 2026", description: "Outdoor ceremonies, golden hour portraits." },
        { id: "", title: "Family sessions", description: "On-location, natural light." },
        { id: "", title: "Brand portraits", description: "Headshots for founders and creatives." },
      ],
      services: [
        { id: "", title: "Couples session", description: "60 min, ~30 edited photos.", price: "$450" },
        { id: "", title: "Wedding (full day)", description: "8 hours, two photographers.", price: "From $3,200" },
        { id: "", title: "Brand headshots", description: "30 min, 5 edited photos.", price: "$220" },
      ],
    }),
  },
  {
    id: "fitness",
    label: "Fitness / personal trainer",
    emoji: "🏋️",
    description: "Classes, packages, trainer bios.",
    seed: () => ({
      tagline: "Train smarter. Move better. Feel stronger.",
      description: "Small-group strength and conditioning for adults of any experience level.",
      primaryColor: "#16a34a",
      sections: sections({ technicians: true, shop: false }),
      services: [
        { id: "", title: "Drop-in class", description: "60-min small group.", price: "$25" },
        { id: "", title: "10-class pack", description: "Use anytime within 3 months.", price: "$220" },
        { id: "", title: "Private session", description: "1-on-1 coaching, custom plan.", price: "$80" },
      ],
    }),
  },
  {
    id: "shop",
    label: "Small online shop",
    emoji: "🛍️",
    description: "Product list, reviews, contact info.",
    seed: () => ({
      tagline: "Small batch goods, made with care.",
      description: "Independent shop with a small, considered catalog of products we'd buy ourselves.",
      primaryColor: "#7c3aed",
      sections: sections({ shop: true, services: false, portfolio: false, booking: false }),
      products: [
        { id: "", name: "Sample product A", price: "$24", description: "Replace me with your real product." },
        { id: "", name: "Sample product B", price: "$48", description: "Replace me with your real product." },
        { id: "", name: "Sample product C", price: "$12", description: "Replace me with your real product." },
      ],
    }),
  },
  {
    id: "blank",
    label: "Blank",
    emoji: "📄",
    description: "Empty draft — for the truly unique.",
    seed: () => ({}),
  },
];
