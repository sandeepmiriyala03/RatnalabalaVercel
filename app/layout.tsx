// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ratnalabala",
  description: "Telugu Poems Platform",
  manifest: "/manifest.json",          // ✅ THIS WAS MISSING
  themeColor: "#1976d2",               // ✅ Required for PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ratnalabala",
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
      </body>
    </html>
  );
}
