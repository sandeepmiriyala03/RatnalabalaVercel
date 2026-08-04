"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (!registration) {
            navigator.serviceWorker
              .register("/sw-custom.js", { scope: "/" })
              .then(() =>
                console.log("✅ Service Worker registered")
              )
              .catch((err) =>
                console.error(
                  "❌ Service Worker registration failed",
                  err
                )
              );
          }
        });
    }
  }, []);

  return null;
}
