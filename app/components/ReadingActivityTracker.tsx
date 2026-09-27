"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { addReadingTime, recordEntryOpen, type ReadingEntryInput } from "@/lib/myReading";

const MODULE_LABELS: Record<string, string> = {
  "/": "రత్నాలబాల",
  "/poems": "పద్యాలవాల",
  "/mirapoems": "మిరా పద్యాలు",
  "/shatakamu": "శతకాలమాల",
  "/smruthimala": "స్మృతిమాల",
  "/kathamala": "కథామాల",
  "/parabhava": "పరాభవమాల",
  "/aksharamala": "అక్షరమాల",
  "/guninta": "గుణింతమాల",
  "/padalamala": "పదాలమాల",
  "/sametalu": "సామెతలమాల",
  "/sandhi": "సంధిమాల",
  "/samasa": "సమాసమాల",
  "/chitramala": "చిత్రమాల",
  "/swaramala": "స్వరమాల",
  "/lipimala": "లిపిమాల",
  "/khatiMala": "ఖతిమాల",
  "/rahasyabhasha": "విదురమాల",
  "/shailimala": "శైలిమాల",
  "/geeta": "భగవద్గీత",
  "/news": "తెలుగు వాచకి",
  "/video": "వీడియోలు",
  "/mira": "మిరా",
  "/MIRIAQuiz": "మిరియా క్విజ్",
  "/test-lab": "పరీక్షల కేంద్రం",
};

export function getReadingModuleTitle(pathname: string) {
  return MODULE_LABELS[pathname] ?? decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "మాడ్యూల్");
}

export default function ReadingActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === "/my-reading") return;

    const entry: ReadingEntryInput = {
      id: `module:${pathname}`,
      kind: "module",
      title: getReadingModuleTitle(pathname),
      module: "మాడ్యూల్ సందర్శన",
      href: pathname,
    };

    let counted = false;
    const countTimer = window.setTimeout(() => {
      counted = true;
      void recordEntryOpen(entry).catch(() => {});
    }, 1000);

    const timer = window.setInterval(() => {
      if (counted && document.visibilityState === "visible") {
        void addReadingTime(entry, 5).catch(() => {});
      }
    }, 5000);

    return () => {
      window.clearTimeout(countTimer);
      window.clearInterval(timer);
    };
  }, [pathname]);

  return null;
}