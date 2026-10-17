import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Creator · Build Beautiful Websites",
  description:
    "Create and customize beautiful websites with our easy-to-use website builder. Choose from templates, customize design, and export your website.",
};

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
        <div className="min-h-dvh w-full">{children}</div>
      </body>
    </html>
  );
}
