"use client";

/* ముందు చూపు (preview) — PDF / పోస్టర్ గీసే అదే engine తో, అదే కొలతలతో.
   ఫోన్‌లో చిన్నగా, కంప్యూటర్‌లో పెద్దగా — కానీ పేజీ మాత్రం ఒక్కటే.
   పేజీలోని ఏ భాగాన్ని నొక్కినా ఆ పెట్టె ఎడిటర్‌లో ఎంచుకోబడుతుంది. */

import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { hitTest, paintPage, type Layout } from "./engine";
import type { Project } from "./model";

type PageProps = {
  layout: Layout;
  index: number;
  project: Project;
  tick: number;
  selected?: string | null;
  onPick?: (blockId: string) => void;
  maxWidth?: number;
  label?: string;
};

export function PageCanvas({ layout, index, project, tick, selected, onPick, maxWidth, label }: PageProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !width) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const px = width * dpr;
    c.width = Math.round(px);
    c.height = Math.round((px * layout.h) / layout.w);
    const ctx = c.getContext("2d");
    if (ctx) paintPage(ctx, layout, index, px / layout.w, { project });
  }, [layout, index, project, width, tick]);

  const k = width / layout.w;
  const boxes = selected ? layout.boxes.filter((b) => b.page === index && b.blockId === selected) : [];

  return (
    <Box ref={wrap} sx={{ position: "relative", width: "100%", maxWidth, mx: "auto" }}>
      <Box
        component="canvas"
        ref={canvas}
        role="img"
        aria-label={label ?? `పేజీ ${index + 1}`}
        onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (!onPick) return;
          const r = e.currentTarget.getBoundingClientRect();
          const id = hitTest(layout, index, (e.clientX - r.left) / k, (e.clientY - r.top) / k);
          if (id) onPick(id);
        }}
        sx={{
          display: "block",
          width: "100%",
          aspectRatio: `${layout.w} / ${layout.h}`,
          borderRadius: "6px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
          cursor: onPick ? "pointer" : "default",
          bgcolor: layout.theme.bg[0],
        }}
      />
      {boxes.map((b, i) => (
        <Box
          key={i}
          aria-hidden
          sx={{
            position: "absolute",
            left: (b.x - 5) * k,
            top: (b.y - 4) * k,
            width: (b.w + 10) * k,
            height: (b.h + 8) * k,
            border: "2px dashed var(--focus-ring)",
            borderRadius: "6px",
            pointerEvents: "none",
          }}
        />
      ))}
    </Box>
  );
}

type Props = {
  layout: Layout;
  project: Project;
  tick: number;
  selected: string | null;
  onPick: (blockId: string) => void;
  /** slides: only this slide */
  only?: number;
};

export default function Preview({ layout, project, tick, selected, onPick, only }: Props) {
  const pages = only !== undefined ? [Math.min(only, layout.pages.length - 1)] : layout.pages.map((_, i) => i);
  const overflow = pages.some((i) => layout.pages[i]?.overflow);
  const portrait = layout.h > layout.w;
  return (
    <Box>
      <Box sx={{ display: "grid", gap: 2.5 }}>
        {pages.map((i) => (
          <Box key={i}>
            <PageCanvas layout={layout} index={i} project={project} tick={tick} selected={selected} onPick={onPick} maxWidth={portrait ? 560 : undefined} />
            {only === undefined && layout.pages.length > 1 && (
              <Typography variant="body2" align="center" sx={{ mt: 0.75, color: "var(--muted-text)", fontWeight: 700 }}>
                పేజీ {i + 1} / {layout.pages.length}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      {overflow && (
        <Typography role="status" sx={{ mt: 1.5, p: 1.25, borderRadius: "10px", bgcolor: "#fff3cd", color: "#5c3b00", fontWeight: 700 }}>
          ⚠️ పాఠ్యం ఎక్కువై పేజీలో పట్టడం లేదు. అక్షరాల సైజు తగ్గించండి లేదా కొంత పాఠ్యం ఇంకో {project.mode === "slides" ? "స్లైడ్‌" : "పేజీ"}కి మార్చండి.
        </Typography>
      )}
    </Box>
  );
}
