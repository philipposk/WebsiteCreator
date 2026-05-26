// Runtime-agnostic HTML builder. Safe to import from server routes AND client components.
// Do not add server-only imports (next/server, fs, etc.) here.

import { type WebsiteInfo } from "@/lib/types";

const escape = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stars = (rating: number): string => {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
};

const fontStack = (font: string): string =>
  font === "System"
    ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : font;

const safeImg = (url: string | undefined, alt: string, fallback: string): string => {
  if (!url) {
    return `<div class="img-fallback">${escape(fallback)}</div>`;
  }
  return `<img src="${escape(url)}" alt="${escape(alt)}" loading="lazy" />`;
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

// WCAG contrast check — auto-flip CTA text to dark when primary is too light.
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const ch = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function ctaTextColor(primary: string): string {
  // Return readable text color over the given background.
  return luminance(primary) > 0.5 ? "#1a1a1a" : "#ffffff";
}

type SectionRenderer = (info: WebsiteInfo, siteId?: string) => string;

const renderAbout: SectionRenderer = (info) => `
  <section id="about" class="section section-alt">
    <div class="container">
      <h2 class="section-title">About</h2>
      <p class="section-lead">${escape(info.description || info.tagline || `Welcome to ${info.name}.`)}</p>
    </div>
  </section>`;

const renderServices: SectionRenderer = (info) => {
  if (!info.services.length) return "";
  const cards = info.services
    .map(
      (s) => `
      <article class="card">
        <h3>${escape(s.title || "Untitled service")}</h3>
        ${s.description ? `<p>${escape(s.description)}</p>` : ""}
        ${s.price ? `<div class="price">${escape(s.price)}</div>` : ""}
      </article>`
    )
    .join("");
  return `
  <section id="services" class="section">
    <div class="container">
      <h2 class="section-title">Services</h2>
      <div class="grid grid-3">${cards}</div>
    </div>
  </section>`;
};

const renderPortfolio: SectionRenderer = (info) => {
  if (!info.portfolio.length) return "";
  const items = info.portfolio
    .map(
      (p) => `
      <figure class="portfolio-item">
        ${safeImg(p.imageUrl, p.title, p.title || "Portfolio item")}
        <figcaption>
          <h3>${escape(p.title || "")}</h3>
          ${p.description ? `<p>${escape(p.description)}</p>` : ""}
        </figcaption>
      </figure>`
    )
    .join("");
  return `
  <section id="portfolio" class="section section-alt">
    <div class="container">
      <h2 class="section-title">Portfolio</h2>
      <div class="grid grid-3">${items}</div>
    </div>
  </section>`;
};

const renderReviews: SectionRenderer = (info) => {
  if (!info.reviews.length) return "";
  const items = info.reviews
    .map(
      (r) => `
      <blockquote class="review">
        <div class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</div>
        <p>&ldquo;${escape(r.text || "")}&rdquo;</p>
        <cite>— ${escape(r.author || "Anonymous")}</cite>
      </blockquote>`
    )
    .join("");
  return `
  <section id="reviews" class="section">
    <div class="container">
      <h2 class="section-title">What customers say</h2>
      <div class="grid grid-3">${items}</div>
    </div>
  </section>`;
};

const renderTeam: SectionRenderer = (info) => {
  if (!info.team.length) return "";
  const items = info.team
    .map(
      (m) => `
      <div class="team-card">
        <div class="avatar">${
          m.photoUrl
            ? `<img src="${escape(m.photoUrl)}" alt="${escape(m.name)}" loading="lazy" />`
            : `<span>${escape(initials(m.name))}</span>`
        }</div>
        <h3>${escape(m.name || "")}</h3>
        ${m.role ? `<p class="role">${escape(m.role)}</p>` : ""}
        ${m.bio ? `<p>${escape(m.bio)}</p>` : ""}
      </div>`
    )
    .join("");
  return `
  <section id="team" class="section section-alt">
    <div class="container">
      <h2 class="section-title">Team</h2>
      <div class="grid grid-3">${items}</div>
    </div>
  </section>`;
};

const renderBlog: SectionRenderer = (info) => {
  if (!info.blog.length) return "";
  const items = info.blog
    .map(
      (b) => `
      <article class="card">
        ${b.date ? `<div class="meta">${escape(b.date)}</div>` : ""}
        <h3>${escape(b.title || "Untitled post")}</h3>
        <p>${escape(b.excerpt || "")}</p>
      </article>`
    )
    .join("");
  return `
  <section id="blog" class="section">
    <div class="container">
      <h2 class="section-title">From the blog</h2>
      <div class="grid grid-3">${items}</div>
    </div>
  </section>`;
};

const renderShop: SectionRenderer = (info) => {
  if (!info.products.length) return "";
  const items = info.products
    .map(
      (p) => `
      <article class="product">
        ${safeImg(p.imageUrl, p.name, p.name || "Product")}
        <div class="product-body">
          <h3>${escape(p.name || "")}</h3>
          ${p.description ? `<p>${escape(p.description)}</p>` : ""}
          ${p.price ? `<div class="price">${escape(p.price)}</div>` : ""}
        </div>
      </article>`
    )
    .join("");
  return `
  <section id="shop" class="section section-alt">
    <div class="container">
      <h2 class="section-title">Shop</h2>
      <div class="grid grid-3">${items}</div>
    </div>
  </section>`;
};

const renderBooking: SectionRenderer = (info) => `
  <section id="booking" class="section cta">
    <div class="container">
      <h2 class="section-title">Get in touch</h2>
      <p class="section-lead">Ready to start? Reach out and we&rsquo;ll get back to you fast.</p>
      ${info.phone ? `<a class="btn btn-light" href="tel:${escape(info.phone.replace(/\s+/g, ""))}">Call ${escape(info.phone)}</a>` : ""}
      ${info.email ? `<a class="btn btn-light" href="mailto:${escape(info.email)}">Email us</a>` : ""}
    </div>
  </section>`;

const renderContactForm = (siteId: string | undefined): string => {
  if (!siteId) return "";
  return `
    <form class="contact-form" method="POST" action="/api/forms/submit?site=${encodeURIComponent(siteId)}">
      <input type="text" name="name" required placeholder="Your name" aria-label="Your name" />
      <input type="email" name="email" required placeholder="Your email" aria-label="Your email" />
      <textarea name="message" required placeholder="How can we help?" rows="4" aria-label="Your message"></textarea>
      <button type="submit" class="btn btn-primary">Send message</button>
      <p class="form-note">We&rsquo;ll get back to you by email.</p>
    </form>`;
};

const renderContact = (info: WebsiteInfo, siteId: string | undefined): string => {
  const items = [
    info.phone ? `<div class="contact-item"><h3>Phone</h3><p><a href="tel:${escape(info.phone.replace(/\s+/g, ""))}">${escape(info.phone)}</a></p></div>` : "",
    info.email ? `<div class="contact-item"><h3>Email</h3><p><a href="mailto:${escape(info.email)}">${escape(info.email)}</a></p></div>` : "",
    info.address ? `<div class="contact-item"><h3>Address</h3><p>${escape(info.address)}</p></div>` : "",
    info.website ? `<div class="contact-item"><h3>Website</h3><p><a href="${escape(info.website)}" target="_blank" rel="noopener">${escape(info.website)}</a></p></div>` : "",
  ]
    .filter(Boolean)
    .join("");
  const hasContact = items.length > 0;
  const form = renderContactForm(siteId);
  if (!hasContact && !form) return "";
  return `
  <section id="contact" class="section">
    <div class="container">
      <h2 class="section-title">Contact</h2>
      ${hasContact ? `<div class="grid grid-3">${items}</div>` : ""}
      ${form}
    </div>
  </section>`;
};

const buildNav = (info: WebsiteInfo): string => {
  const links: string[] = [];
  const sec = info.sections;
  if (sec.about) links.push(`<a href="#about">About</a>`);
  if (sec.services && info.services.length) links.push(`<a href="#services">Services</a>`);
  if (sec.portfolio && info.portfolio.length) links.push(`<a href="#portfolio">Portfolio</a>`);
  if (sec.reviews && info.reviews.length) links.push(`<a href="#reviews">Reviews</a>`);
  if (sec.technicians && info.team.length) links.push(`<a href="#team">Team</a>`);
  if (sec.blog && info.blog.length) links.push(`<a href="#blog">Blog</a>`);
  if (sec.shop && info.products.length) links.push(`<a href="#shop">Shop</a>`);
  if (info.phone || info.email || info.address) links.push(`<a href="#contact">Contact</a>`);
  return links.join("");
};

const buildSections = (info: WebsiteInfo, siteId: string | undefined): string => {
  const out: string[] = [];
  const sec = info.sections;
  if (sec.about) out.push(renderAbout(info));
  if (sec.services) out.push(renderServices(info));
  if (sec.portfolio) out.push(renderPortfolio(info));
  if (sec.reviews) out.push(renderReviews(info));
  if (sec.technicians) out.push(renderTeam(info));
  if (sec.blog) out.push(renderBlog(info));
  if (sec.shop) out.push(renderShop(info));
  if (sec.booking) out.push(renderBooking(info));
  out.push(renderContact(info, siteId));
  return out.filter(Boolean).join("\n");
};

const sharedCSS = (info: WebsiteInfo, advanced: boolean): string => {
  const ctaText = ctaTextColor(info.primaryColor);
  return `
  :root {
    --primary: ${info.primaryColor};
    --primary-fade: ${info.primaryColor}1a;
    --primary-strong: ${info.primaryColor}cc;
    --on-primary: ${ctaText};
    --bg: #ffffff;
    --bg-alt: #f7f7f9;
    --text: #1a1a1a;
    --muted: #5b6271;
    --border: #e8e8ee;
    --radius: ${advanced ? "14px" : "8px"};
    --shadow: 0 6px 24px rgba(15, 17, 26, 0.06);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: ${fontStack(info.fontFamily)};
    color: var(--text);
    line-height: 1.6;
    background: var(--bg);
  }
  a { color: var(--primary); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .skip-link { position: absolute; left: -9999px; top: 0; background: #000; color: #fff; padding: 8px 12px; z-index: 100; }
  .skip-link:focus { left: 8px; top: 8px; }
  .container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
  .topbar { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.85); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
  .topbar .container { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; padding-bottom: 16px; gap: 24px; }
  .brand { font-weight: 700; font-size: 1.25rem; color: var(--text); display: flex; align-items: center; gap: 10px; }
  .brand:hover { text-decoration: none; }
  .brand img { height: 32px; width: auto; }
  nav { display: flex; flex-wrap: wrap; gap: 22px; }
  nav a { color: var(--text); font-weight: 500; }
  nav a:hover { color: var(--primary); text-decoration: none; }
  .hero { padding: ${advanced ? "120px 0 100px" : "80px 0"}; background: linear-gradient(160deg, var(--primary-fade), var(--bg) 70%); text-align: center; }
  .hero h1 { font-size: clamp(2rem, 4.5vw, ${advanced ? "3.75rem" : "3rem"}); font-weight: 800; letter-spacing: -0.02em; }
  .hero .tagline { margin-top: 14px; font-size: 1.25rem; color: var(--muted); max-width: 720px; margin-left: auto; margin-right: auto; }
  .hero .cta-row { margin-top: 32px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn { display: inline-block; padding: 12px 22px; border-radius: var(--radius); font-weight: 600; transition: transform .2s, box-shadow .2s, background .2s; border: 1px solid transparent; cursor: pointer; font-size: 1rem; }
  .btn-primary { background: var(--primary); color: var(--on-primary); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--shadow); text-decoration: none; }
  .btn-outline { background: transparent; color: var(--primary); border-color: var(--primary); }
  .btn-light { background: #fff; color: var(--primary); margin: 4px; }
  .section { padding: ${advanced ? "96px 0" : "72px 0"}; }
  .section-alt { background: var(--bg-alt); }
  .section-title { font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 700; text-align: center; margin-bottom: 14px; letter-spacing: -0.01em; }
  .section-lead { text-align: center; color: var(--muted); max-width: 720px; margin: 0 auto 48px; font-size: 1.1rem; }
  .grid { display: grid; gap: 24px; margin-top: 40px; }
  .grid-3 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow); transition: transform .2s, box-shadow .2s; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15,17,26,.09); }
  .card h3 { font-size: 1.2rem; margin-bottom: 10px; }
  .card .price { margin-top: 14px; font-weight: 700; color: var(--primary); font-size: 1.2rem; }
  .card .meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 6px; }
  .portfolio-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
  .portfolio-item img { width: 100%; height: 220px; object-fit: cover; display: block; }
  .portfolio-item figcaption { padding: 20px; }
  .portfolio-item h3 { font-size: 1.1rem; margin-bottom: 6px; }
  .img-fallback { width: 100%; height: 220px; display: flex; align-items: center; justify-content: center; background: var(--primary-fade); color: var(--primary); font-weight: 600; }
  .review { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
  .stars { color: #f5b400; font-size: 1.05rem; letter-spacing: 2px; margin-bottom: 10px; }
  .review cite { display: block; margin-top: 12px; color: var(--muted); font-style: normal; font-weight: 600; }
  .team-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; text-align: center; box-shadow: var(--shadow); }
  .avatar { width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 14px; overflow: hidden; background: var(--primary-fade); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 1.5rem; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .team-card h3 { font-size: 1.1rem; }
  .team-card .role { color: var(--primary); font-weight: 600; margin-bottom: 8px; }
  .product { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); display: flex; flex-direction: column; }
  .product img { width: 100%; height: 200px; object-fit: cover; }
  .product .product-body { padding: 20px; }
  .product .price { color: var(--primary); font-weight: 700; margin-top: 12px; font-size: 1.15rem; }
  .cta { background: linear-gradient(135deg, var(--primary), var(--primary-strong)); color: var(--on-primary); text-align: center; }
  .cta .section-title, .cta .section-lead { color: var(--on-primary); opacity: 1; }
  .contact-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; text-align: center; box-shadow: var(--shadow); }
  .contact-item h3 { color: var(--primary); margin-bottom: 10px; }
  .contact-form { max-width: 520px; margin: 40px auto 0; display: grid; gap: 12px; }
  .contact-form input, .contact-form textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius); font-family: inherit; font-size: 1rem; }
  .contact-form button { justify-self: start; }
  .contact-form .form-note { font-size: 0.85rem; color: var(--muted); }
  footer { background: #14161d; color: rgba(255,255,255,.75); text-align: center; padding: 40px 24px; }
  footer a { color: rgba(255,255,255,.9); }
  @media (max-width: 720px) {
    nav { gap: 14px; font-size: .95rem; }
    .topbar .container { flex-direction: column; align-items: flex-start; }
    .hero { padding: 64px 0; }
  }
`;
};

function jsonLd(info: WebsiteInfo, canonicalUrl?: string): string {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: info.name || "Untitled",
    description: info.description || info.tagline || undefined,
    telephone: info.phone || undefined,
    email: info.email || undefined,
    address: info.address || undefined,
    url: canonicalUrl || info.website || undefined,
    image: info.ogImageUrl || info.logoUrl || undefined,
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

export type BuildOptions = {
  /** Public site identifier used by the contact form action URL. */
  siteId?: string;
  /** Canonical URL of the published page, used in og:url + JSON-LD. */
  canonicalUrl?: string;
};

export function buildHTML(info: WebsiteInfo, opts: BuildOptions = {}): string {
  const advanced = info.template === "advanced";
  const title = info.name || "My Website";
  const description = info.description || info.tagline || `${title} — official website.`;
  const nav = buildNav(info);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(description)}" />
<meta property="og:type" content="website" />
${opts.canonicalUrl ? `<meta property="og:url" content="${escape(opts.canonicalUrl)}" />` : ""}
${info.ogImageUrl ? `<meta property="og:image" content="${escape(info.ogImageUrl)}" />` : ""}
${info.logoUrl ? `<link rel="icon" href="${escape(info.logoUrl)}" />` : ""}
${jsonLd(info, opts.canonicalUrl)}
<style>${sharedCSS(info, advanced)}</style>
</head>
<body>
<a href="#main" class="skip-link">Skip to content</a>
<header class="topbar">
  <div class="container">
    <a href="#" class="brand">${info.logoUrl ? `<img src="${escape(info.logoUrl)}" alt="${escape(title)} logo" />` : ""}<span>${escape(title)}</span></a>
    <nav aria-label="Primary">${nav}</nav>
  </div>
</header>

<main id="main">
<section class="hero">
  <div class="container">
    <h1>${escape(title)}</h1>
    ${info.tagline ? `<p class="tagline">${escape(info.tagline)}</p>` : info.description ? `<p class="tagline">${escape(info.description)}</p>` : ""}
    <div class="cta-row">
      ${info.sections.services && info.services.length ? `<a class="btn btn-primary" href="#services">See services</a>` : ""}
      ${info.sections.booking ? `<a class="btn btn-outline" href="#booking">Get in touch</a>` : info.email ? `<a class="btn btn-outline" href="mailto:${escape(info.email)}">Email us</a>` : ""}
    </div>
  </div>
</section>

${buildSections(info, opts.siteId)}
</main>

<footer>
  <p>&copy; ${new Date().getFullYear()} ${escape(title)}. All rights reserved.</p>
</footer>
</body>
</html>`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "site";
}
