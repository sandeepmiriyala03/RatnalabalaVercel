"use client";

/* స్లైడ్ల వరుస — చిన్న బొమ్మలు, కొత్త స్లైడ్ (5 అమరికలు), నకలు, తొలగించు,
   జరుపు, "పత్రం నుంచి N స్లైడ్లు" */

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { renderPage, type Layout } from "./engine";
import { cloneBlock, docToSlides, newSlide, SLIDE_LAYOUTS, uid, type Project, type Slide, type SlideLayout } from "./model";

type Props = {
  p: Project;
  layout: Layout;
  current: number;
  tick: number;
  onCurrent: (i: number) => void;
  set: (fn: (p: Project) => Project) => void;
};

function Thumb({ layout, index, p, tick }: { layout: Layout; index: number; p: Project; tick: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const c = renderPage(layout, index, 180, { project: p });
      setSrc(c.toDataURL("image/jpeg", 0.8));
      c.width = c.height = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [layout, index, p, tick]);
  return src ? <Box component="img" src={src} alt="" sx={{ width: "100%", display: "block", borderRadius: "4px" }} /> : <Box sx={{ aspectRatio: `${layout.w}/${layout.h}`, bgcolor: "var(--surface)" }} />;
}

export default function SlidesBar({ p, layout, current, tick, onCurrent, set }: Props) {
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [make, setMake] = useState(false);
  const [count, setCount] = useState(5);
  const n = p.slides.length;

  const update = (fn: (s: Slide[]) => Slide[]) => set((x) => ({ ...x, slides: fn(x.slides) }));
  const add = (layoutId: SlideLayout) => {
    update((s) => [...s.slice(0, current + 1), newSlide(layoutId), ...s.slice(current + 1)]);
    onCurrent(current + 1);
    setMenu(null);
  };
  const move = (d: -1 | 1) => {
    const j = current + d;
    if (j < 0 || j >= n) return;
    update((s) => {
      const c = [...s];
      [c[current], c[j]] = [c[j], c[current]];
      return c;
    });
    onCurrent(j);
  };
  const ratio = layout.w / layout.h;
  const btn = { width: 44, height: 44 };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", flex: 1 }}>
          🎞️ స్లైడ్లు ({n})
        </Typography>
        <Button variant="outlined" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => setMake(true)} sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}>
          ఎన్ని స్లైడ్లు?
        </Button>
      </Stack>

      <Box role="listbox" aria-label="స్లైడ్లు" sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, scrollSnapType: "x proximity" }}>
        {p.slides.map((s, i) => (
          <Box
            key={s.id}
            role="option"
            aria-selected={i === current}
            aria-label={`స్లైడ్ ${i + 1}`}
            tabIndex={0}
            onClick={() => onCurrent(i)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onCurrent(i))}
            sx={{
              flex: `0 0 ${ratio >= 1 ? 132 : 84}px`,
              scrollSnapAlign: "start",
              p: 0.5,
              borderRadius: "8px",
              cursor: "pointer",
              border: i === current ? "3px solid var(--secondary)" : "1px solid var(--border-strong)",
              bgcolor: "var(--surface-elevated)",
              "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 },
            }}
          >
            <Thumb layout={layout} index={i} p={p} tick={tick} />
            <Typography variant="body2" align="center" sx={{ fontWeight: 800, mt: 0.25 }}>
              {i + 1}
            </Typography>
          </Box>
        ))}
        <Box
          component="button"
          type="button"
          onClick={(e) => setMenu(e.currentTarget)}
          aria-label="కొత్త స్లైడ్"
          sx={{ flex: "0 0 96px", minHeight: 80, borderRadius: "8px", border: "2px dashed var(--secondary)", bgcolor: "transparent", color: "var(--secondary)", fontWeight: 800, font: "inherit", cursor: "pointer", "&:focus-visible": { outline: "3px solid var(--focus-ring)" } }}
        >
          <AddRoundedIcon />
          <br />
          కొత్త స్లైడ్
        </Box>
      </Box>

      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography sx={{ fontWeight: 700, mr: 0.5 }}>స్లైడ్ {current + 1}:</Typography>
        <Tooltip title="ఎడమకు జరపండి">
          <span>
            <IconButton aria-label="స్లైడ్ ఎడమకు జరపండి" disabled={current === 0} onClick={() => move(-1)} sx={btn}>
              <ChevronLeftRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="కుడికి జరపండి">
          <span>
            <IconButton aria-label="స్లైడ్ కుడికి జరపండి" disabled={current >= n - 1} onClick={() => move(1)} sx={btn}>
              <ChevronRightRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="ఈ స్లైడ్ నకలు">
          <IconButton
            aria-label="ఈ స్లైడ్ నకలు"
            onClick={() => {
              update((s) => [...s.slice(0, current + 1), { ...s[current], id: uid(), blocks: s[current].blocks.map(cloneBlock) }, ...s.slice(current + 1)]);
              onCurrent(current + 1);
            }}
            sx={btn}
          >
            <ContentCopyRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="ఈ స్లైడ్ తీసివేయండి">
          <span>
            <IconButton
              aria-label="ఈ స్లైడ్ తీసివేయండి"
              disabled={n <= 1}
              onClick={() => {
                update((s) => s.filter((_, i) => i !== current));
                onCurrent(Math.max(0, current - 1));
              }}
              sx={{ ...btn, color: "#a31515" }}
            >
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Button
          size="small"
          onClick={() => update((s) => s.map((x, i) => (i === current ? { ...x, vAlign: x.vAlign === "middle" ? "top" : "middle" } : x)))}
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}
        >
          {p.slides[current]?.vAlign === "middle" ? "⬆ పైన పెట్టు" : "↕ మధ్యలో పెట్టు"}
        </Button>
      </Stack>

      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
        {SLIDE_LAYOUTS.map((l) => (
          <MenuItem key={l.id} onClick={() => add(l.id)} sx={{ minHeight: 52, fontSize: "1.05rem" }}>
            {l.label}
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={make} onClose={() => setMake(false)} aria-labelledby="make-title" fullWidth maxWidth="xs">
        <DialogTitle id="make-title" sx={{ fontWeight: 800 }}>
          ఎన్ని స్లైడ్లు కావాలి?
        </DialogTitle>
        <DialogContent>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ my: 1 }}>
            <IconButton aria-label="ఒకటి తగ్గించు" onClick={() => setCount((c) => Math.max(1, c - 1))} sx={{ width: 56, height: 56, border: "2px solid var(--border-strong)" }}>
              <RemoveRoundedIcon />
            </IconButton>
            <Typography sx={{ fontSize: "2.4rem", fontWeight: 800, minWidth: 64, textAlign: "center" }} aria-live="polite">
              {count}
            </Typography>
            <IconButton aria-label="ఒకటి పెంచు" onClick={() => setCount((c) => Math.min(40, c + 1))} sx={{ width: 56, height: 56, border: "2px solid var(--border-strong)" }}>
              <AddRoundedIcon />
            </IconButton>
          </Stack>
          <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
            "పత్రం నుంచి" — మీ పత్రంలోని శీర్షిక, పేరాలు, పద్యాలు, చిత్రాలను {count} స్లైడ్లుగా సమానంగా పంచుతాం. ఇప్పుడున్న స్లైడ్లు మారిపోతాయి (వెనక్కి ↶ తో తిరిగి పొందవచ్చు).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              set((x) => {
                const s = [...x.slides];
                while (s.length < count) s.push(newSlide(s.length === 0 ? "title" : "content"));
                return { ...x, slides: s.slice(0, count) };
              });
              onCurrent(0);
              setMake(false);
            }}
            sx={{ minHeight: 48, textTransform: "none", fontWeight: 700 }}
          >
            ఖాళీ స్లైడ్లు
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              set((x) => ({ ...x, slides: docToSlides(x.blocks, count, x.title) }));
              onCurrent(0);
              setMake(false);
            }}
            sx={{ minHeight: 48, textTransform: "none", fontWeight: 800, bgcolor: "var(--secondary)" }}
          >
            పత్రం నుంచి తయారు చేయి
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
