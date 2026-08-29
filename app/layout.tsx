// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next"; // Added Viewport type

import YuktaiClient from "@/app/components/YuktaiClient";

// Theme color and scaling now go here in Next.js 13.4+.
// Split light/dark so the browser chrome (Android address bar tint,
// iOS status bar) matches whichever --primary globals.css is actually
// using — a single static value here would keep showing the light-mode
// maroon even while the rest of the site had switched to dark mode.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8B3A1F" }, // matches --primary (light) in globals.css
    { media: "(prefers-color-scheme: dark)", color: "#e2916a" },  // matches --primary (dark) in globals.css
  ],
};

export const metadata: Metadata = {
  title: "రత్నాలబాల – జ్ఞానమాల",
  description:
    "AI ఆధారిత తెలుగు జ్ఞానమాల | పద్యాలు, కథలు, అక్షరాలు, చిత్రాలు & సంస్కృతి",
  manifest: "/manifest.json", // Fixed: Added missing comma here
  // 🍎 Apple PWA
  appleWebApp: {
    capable: true,
    title: "రత్నాలబాల – జ్ఞానమాల",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/icons/icon-192x192.png",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
      {
        url: "/icons/icon-192x192.png",
      },
    ],
  },


  other: {
    "msapplication-TileColor": "#8B3A1F", // matches --primary (terracotta) in globals.css
    "msapplication-TileImage": "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="te">
      <head>
        {/* Runs before hydration/paint, so the correct theme is already
            in place the instant the page renders — without this, the
            page would flash light-mode colors first and then snap to
            the saved dark preference a moment later. Wrapped in
            try/catch since some browsers block localStorage in private
            browsing, in which case we just fall back to the OS setting
            (the @media rule in globals.css already handles that case). */}
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

        <RootClientLayout>{children}</RootClientLayout>

        {/* Was imported but never rendered — assuming this is a global
            floating widget in the same family as FloatingAIButton
            (rendered inside RootClientLayout). Placed at root level
            here since it was imported at the root layout, not inside
            a specific page. Move it if that assumption is wrong. */}
        

        <Analytics />
        <SpeedInsights />

      </body>
    </html>
  );
}