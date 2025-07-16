"use client";

import Image from "next/image";

export default function AuthorPhoto() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        borderRadius: "50%",
        overflow: "hidden",
        width: "80px",
        height: "80px",
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
      }}
    >
      <Image src="/Images/author.png" alt="Author" width={80} height={80} />
    </div>
  );
}
