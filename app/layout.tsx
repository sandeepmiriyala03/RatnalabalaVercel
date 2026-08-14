// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next"; // Added Viewport type

import YuktaiClient from "@/app/components/YuktaiClient"; 
// Theme color and scaling now go here in Next.js 13.4+
export const viewport: Viewport = {
  themeColor: "#8B3A1F", // matches --primary (terracotta) in globals.css
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
      <body>
     
        <RootClientLayout>{children}</RootClientLayout>
        <Analytics />
        <SpeedInsights />
 
      </body>
    </html>
  );
}