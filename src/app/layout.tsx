import type { Metadata, Viewport } from "next";
import { Fraunces, Newsreader } from "next/font/google";
import "./globals.css";
import { HashScrollHandler } from "@/components/HashScrollHandler";
import { ImagePrivacyGuard } from "@/components/ImagePrivacyGuard";
import { brand, site } from "@/content/site";

/** So tab icons / OG URLs resolve to this origin in dev (not production). */
function metadataBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "https://www.chcstemple.org";
}

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2a1810",
};

export const metadata: Metadata = {
  title: {
    default: brand.appName,
    // Leading CHCS survives tab truncation (browsers usually clip the end first).
    template: `${site.nameShort} — %s`,
  },
  description: `${site.nameFull} — Hindu temple at 16 Ostade Road, London SW2 2BB. ${site.tagline}`,
  metadataBase: new URL(metadataBaseUrl()),
  applicationName: brand.appName,
  openGraph: {
    title: `${site.nameShort} · ${brand.appName} · ${site.nameFull}`,
    description: site.tagline,
    locale: "en_GB",
    type: "website",
  },
  // Tab icons: `src/app/icon.png` + `apple-icon.png` (from `npm run icons`). Avoid duplicating
  // `icons` here — it can fight the file-based metadata API and confuse caching.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body suppressHydrationWarning>
        <HashScrollHandler />
        <ImagePrivacyGuard />
        {children}
      </body>
    </html>
  );
}
