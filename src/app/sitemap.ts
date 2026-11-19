import type { MetadataRoute } from "next";

// Only the builder's own landing page. Published sites under /s/<slug> serve their own sitemap.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://websitecreator.6x7.gr/", changeFrequency: "monthly", priority: 1 }];
}
