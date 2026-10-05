import "./globals.css";
import RootClientLayout from "./RootClientLayout";
// Must match the real file name exactly (Vercel builds on Linux = case-sensitive)
import OfflineBanner from "@/app/components/Offlinebanner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";

const SITE_URL = "https://ratnalabala.vercel.app";

const SITE_NAME = "రత్నాలబాల – జ్ఞానమాల";
const SITE_DESCRIPTION =
  "AI ఆధారిత తెలుగు జ్ఞానమాల | పద్యాలు, కథలు, అక్షరాలు, చిత్రాలు & సంస్కృతి";

// Browser chrome colour (Android address bar, iOS status bar).
// Matches the forest-green Navbar (--secondary in globals.css).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a3d2b" },
    { media: "(prefers-color-scheme: dark)", color: "#6bbd93" },
  ],

  // Full iPhone screen; components add env(safe-area-inset-*) padding.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",

  // Link previews on WhatsApp, LinkedIn, Facebook, etc.
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    images: ["/icons/icon-512x512.png"],
    locale: "te_IN",
    type: "website",
  },

  // Installed iPhone app (no startupImage: iOS ignores ones that
  // don't exactly match the screen size).
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },

  other: {
    "msapplication-TileColor": "#1a3d2b",
    "msapplication-TileImage": "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the theme script below sets data-theme
    // before React loads, avoiding a hydration mismatch.
    <html lang="te" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Apply saved light/dark theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem('theme');
              if (t === 'light' || t === 'dark') {
                document.documentElement.setAttribute('data-theme', t);
              }
            } catch (e) {}`,
          }}
        />
      </head>

      <body>
        {/* Navbar, page content, WebMCP registration and the floating
            buttons (left: AI, right: install + search) */}
        <RootClientLayout>{children}</RootClientLayout>

        {/* One offline banner for every page */}
        <OfflineBanner />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}