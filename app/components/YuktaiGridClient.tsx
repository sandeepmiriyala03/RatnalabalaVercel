"use client";

/* ═══════════════════════════════════════════════════════════════
   Yuktai Grid — సైట్ అంతటా ఒకే రూపంలో (ఏ పేజీలోనైనా ఇదే వాడండి)

     import YGrid from "@/app/components/YuktaiGridClient";
     <YGrid data={rows} columns={cols} rowKey="id" search toolName="ratnalabala_x" />

   1. బ్రౌజర్‌లో మాత్రమే లోడ్ (Grid లోపల new Date() — Next.js 16 build లో ఒప్పుకోదు)
   2. రూపం globals.css §15 (.rb-yuktai): పెద్ద అక్షరాలు, 48px బటన్లు,
      Grid రంగులు మన tokens కి — dark mode లోనూ సరిగ్గా, AAA contrast
   3. పక్కకు జరిగే పట్టికను keyboard తో కూడా చేరవచ్చు (WCAG 2.1.1)
   Inline styles లేవు.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { YuktaiGridProps } from "@yuktishaalaa/yuktai";

const Grid = dynamic(() => import("@yuktishaalaa/yuktai").then((m) => m.YuktaiGrid), {
  ssr: false,
  loading: () => (
    <div role="status" className="rb-placeholder">
      పట్టిక సిద్ధమవుతోంది…
    </div>
  ),
}) as <T extends Record<string, unknown>>(p: YuktaiGridProps<T>) => React.ReactElement;

/** Scrollable boxes inside the grid get tabindex so keyboard users can scroll them */
function useFocusableScrollers(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fix = () =>
      root.querySelectorAll<HTMLElement>("div[style*=\"overflow\"]").forEach((el) => {
        const o = getComputedStyle(el).overflowX;
        if ((o === "auto" || o === "scroll") && !el.hasAttribute("tabindex")) {
          el.tabIndex = 0;
          el.setAttribute("role", "region");
          el.setAttribute("aria-label", "పట్టిక — పక్కకు జరపవచ్చు");
        }
      });
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [ref]);
}

export default function YGrid<T extends Record<string, unknown>>(props: YuktaiGridProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusableScrollers(ref);
  return (
    <div ref={ref} className="rb-yuktai">
      <Grid<T> locale="te-IN" inputLanguage="te-IN" view="auto" mobileBreakpoint={700} {...props} />
    </div>
  );
}
