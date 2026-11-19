import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Canonical stays on the .gr address, also when the page is served from the .dk mirror.
  metadataBase: new URL("https://websitecreator.6x7.gr"),
  alternates: { canonical: "./" },
  title: "Website Creator · Build Beautiful Websites",
  description:
    "Create and customize beautiful websites with our easy-to-use website builder. Choose from templates, customize design, and export your website.",
  openGraph: {
    type: "website",
    siteName: "Website Creator",
    title: "Website Creator · Build Beautiful Websites",
    description: "Pick a template, customize the design, and publish or export your website.",
  },
  twitter: { card: "summary_large_image" },
};

const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Website Creator",
  url: "https://websitecreator.6x7.gr",
  description:
    "Create and customize websites from templates, adjust the design, and export your website.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  publisher: { "@type": "Organization", name: "6x7", url: "https://6x7.gr" },
}).replace(/</g, "\\u003c");

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body suppressHydrationWarning className="bg-background text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <div className="min-h-dvh w-full">{children}</div>
      </body>
    </html>
  );
}
