// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import YuktAIWrapper from "@/app/components/YuktAIWrapper";
export const metadata: Metadata = {
  title: "రత్నాలబాల – జ్ఞానమాల",
  description:
    "AI ఆధారిత తెలుగు జ్ఞానమాల | పద్యాలు, కథలు, అక్షరాలు, చిత్రాలు & సంస్కృతి",
  manifest: "/manifest.json"
  themeColor: "#4A148C",
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

  // 🤖 Windows / Android tiles
  other: {
    "msapplication-TileColor": "#4A148C",
    "msapplication-TileImage": "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}:
{
  children: React.ReactNode;
}) {
  return (
    <html lang="te">
      <body>
          <YuktAIWrapper />
        <RootClientLayout>{children}</RootClientLayout>
        <Analytics />
        <SpeedInsights />
       
      </body>
    </html>
  );
}
