// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ratnalabala",
  description: "Telugu Poems Platform .",
  manifest: "/manifest.json",  // ✅ Auto-adds <link rel="manifest">
  themeColor: "#6A1B9A",
  appleWebApp: {
    capable: true,
    title: "Ratnalabala",
    statusBarStyle: "default",
    startupImage: [
      { url: "/icons/icon-192x192.png", media: "(device-width: 768px) and (device-height: 1024px)" },
      { url: "/icons/icon-192x192.png" }
    ]
  },
  // Android Chrome PWA meta
  other: {
    "msapplication-TileColor": "#6A1B9A",
    "msapplication-TileImage": "/icons/icon-192x192.png"
  }
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
      </body>
    </html>
  );
}
