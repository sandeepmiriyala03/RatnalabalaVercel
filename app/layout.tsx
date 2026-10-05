import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import OfflineBanner from "@/app/components/Offlinebanner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";

// Browser chrome colour (Android address bar, iOS status bar)
// follows the light/dark --primary in globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8B3A1F" },
    { media: "(prefers-color-scheme: dark)", color: "#e2916a" },
  ],

  // Lets the page use the full iPhone screen.
  // env(safe-area-inset-*) keeps UI clear of the notch / home bar.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "రత్నాలబాల – జ్ఞానమాల",
  description:
    "AI ఆధారిత తెలుగు జ్ఞానమాల | పద్యాలు, కథలు, అక్షరాలు, చిత్రాలు & సంస్కృతి",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "రత్నాలబాల – జ్ఞానమాల",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/icons/icon-192x192.png",
        media:
          "(device-width: 768px) and (device-height: 1024px)",
      },
      {
        url: "/icons/icon-192x192.png",
      },
    ],
  },

  other: {
    "msapplication-TileColor": "#8B3A1F",
    "msapplication-TileImage": "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: theme script below sets data-theme
    // before React loads, avoiding hydration mismatch.
    <html
      lang="te"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
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
        <RootClientLayout>
          {children}
        </RootClientLayout>

        {/* One offline banner for every page */}
        <OfflineBanner />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}