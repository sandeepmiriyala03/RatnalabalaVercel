"use client";

import Navbar from "@/app/components/Navbar";

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}