// Improved version of getDeviceBounds — two changes:
//
// 1. More breakpoint tiers instead of just mobile/everything-else,
//    since a phone, tablet, and large desktop have very different
//    ideal max font sizes.
// 2. Turned into a hook that reacts to resize/orientation change.
//    The original function only ran once at initial render — if
//    someone rotated their phone or resized the browser, `min`/`max`
//    never updated until some unrelated re-render happened to fire.

import { useEffect, useState } from "react";

type Bounds = { min: number; max: number };

const BREAKPOINTS: { maxWidth: number; bounds: Bounds }[] = [
  { maxWidth: 400, bounds: { min: 0.85, max: 1.6 } },  // small phones
  { maxWidth: 600, bounds: { min: 0.9, max: 1.8 } },   // phones
  { maxWidth: 960, bounds: { min: 0.95, max: 1.9 } },  // tablets
  { maxWidth: 1440, bounds: { min: 1.0, max: 2.0 } },  // desktop
  { maxWidth: Infinity, bounds: { min: 1.0, max: 2.4 } }, // large/wide screens
];

function computeBounds(width: number): Bounds {
  const match = BREAKPOINTS.find((bp) => width < bp.maxWidth);
  return match ? match.bounds : BREAKPOINTS[BREAKPOINTS.length - 1].bounds;
}

/**
 * Reactive device-based font-size bounds. Re-computes on resize
 * (debounced) and orientation change, unlike the original one-shot
 * function that only ran at initial render.
 */
export function useDeviceFontBounds(): Bounds {
  const [bounds, setBounds] = useState<Bounds>(() =>
    typeof window === "undefined"
      ? { min: 1.0, max: 2.0 }
      : computeBounds(window.innerWidth)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      // Debounced so this doesn't recompute on every pixel of a drag-resize.
      timeoutId = setTimeout(() => {
        setBounds(computeBounds(window.innerWidth));
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return bounds;
}