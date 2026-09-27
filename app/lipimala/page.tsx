"use client";

import dynamic from "next/dynamic";

const TeluguOcrPage = dynamic(
  () => import("@/app/components/TeluguocrPage"),
  { ssr: false }
);

export default function UploadPage() {
  return (
    <>
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        <section className="mb-16">
          <TeluguOcrPage />
        </section>
      </main>

 
    </>
  );
}
