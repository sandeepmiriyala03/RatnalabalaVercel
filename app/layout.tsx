// app/layout.tsx
import "./globals.css";
import RootClientLayout from "./RootClientLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ratnalabala",
  description: "Telugu Poems Platform",
  manifest: "/manifest.json",   // ✅ THIS ENABLES PWA
  themeColor: "#6A1B9A",
  appleWebApp: {
    capable: true,
    title: "Ratnalabala",
    statusBarStyle: "default",
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
