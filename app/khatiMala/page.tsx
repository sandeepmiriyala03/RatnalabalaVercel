"use client";

/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — తెలుగు పత్రాలు, పోస్టర్లు, స్లైడ్ షోలు (MS Office లాగా, సులభంగా)

   • పెట్టెలు: శీర్షిక, పేరా, పద్యం, జాబితా, పట్టిక, చిత్రం, గీత, కొత్త పేజీ
   • ప్రతి పెట్టెకు: ఫాంట్, సైజు, B/I/U, ఎడమ/మధ్య/కుడి/సమం, రంగు, పంక్తి దూరం
   • 10 రూపాలు (themes) · నేపథ్య చిత్రం · పేజీ సంఖ్యలు
   • స్లైడ్ షో: ఎన్ని స్లైడ్లైనా, 5 అమరికలు, పూర్తి తెర, మీ సంగీతంతో
   • ఎగుమతి: PDF · పోస్టర్ PNG · Word (ఫాంట్ లోపలే) · PowerPoint
   • మీ సొంత ఫాంట్లు (ఫైల్ / కంప్యూటర్) · వెనక్కి/ముందుకు · కొత్తది (reset)
   • ఈ పరికరంలోనే ఆటో సేవ్ (చిత్రాలతో సహా) — ఏదీ సర్వర్‌కి వెళ్ళదు

   Preview, PDF, poster, PPT అన్నీ ఒకే canvas engine (khatimala/engine.ts)
   తో గీస్తాం → ఫోన్‌లో చేసినా కంప్యూటర్‌లో చేసినా అదే ఫలితం.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { loadPref } from "@/app/components/exportPoems";
import { findFont, loadTeluguFont, useTeluguFonts } from "@/lib/teluguFonts";
import { clearMeasureCache, fontsUsed, layoutProject, onImageLoad } from "@/app/components/khatimala/engine";
import {
  cloneBlock,
  DEFAULT_PROJECT,
  defaultStyle,
  newBlock,
  sanitizeProject,
  TEMPLATES,
  type Block,
  type BlockType,
  type Project,
} from "@/app/components/khatimala/model";
import { getTheme } from "@/app/components/khatimala/themes";
import { AddBar, BlockCard } from "@/app/components/khatimala/BlockEditor";
import DesignPanel from "@/app/components/khatimala/DesignPanel";
import Preview from "@/app/components/khatimala/Preview";
import SlidesBar from "@/app/components/khatimala/SlidesBar";
import Slideshow from "@/app/components/khatimala/Slideshow";
import ExportDialog from "@/app/components/khatimala/ExportDialog";
import { loadMusic, loadProject, saveMusic, saveProject, type Music } from "@/app/components/khatimala/storage";

type History = { past: Project[]; present: Project; future: Project[] };
const MAX_HISTORY = 60;

/* old version (title + text only) — kept so nobody loses what they wrote */
const OLD_KEY = "ratnalabala-khatimala";
type OldSaved = { title: string; text: string; fontId: string; fontSize: number; canvasSize: string };

export default function KhatiMala() {
  const desktop = useMediaQuery("(min-width:900px)");
  const [mounted, setMounted] = useState(false);
  const [hist, setHist] = useState<History>({ past: [], present: DEFAULT_PROJECT, future: [] });
  const p = hist.present;
  const [selected, setSelected] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState<"edit" | "design" | "preview">("edit");
  const [exportOpen, setExportOpen] = useState(false);
  const [show, setShow] = useState<null | { start: number; autoplay: boolean }>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; undo?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [music, setMusic] = useState<Music | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<"idle" | "ok" | "fail">("idle");
  const [tick, setTick] = useState(0);
  const restored = useRef(false);
  const last = useRef<{ key: string; at: number } | null>(null);
  const { fonts } = useTeluguFonts();

  const bump = useCallback(() => {
    clearMeasureCache();
    setTick((t) => t + 1);
  }, []);

  /* ---------- history ---------- */
  const commit = useCallback((fn: (p: Project) => Project, key?: string) => {
    setHist((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      const now = Date.now();
      const merge = key && last.current?.key === key && now - last.current.at < 1200;
      last.current = key ? { key, at: now } : null;
      if (merge) return { ...h, present: next };
      return { past: [...h.past, h.present].slice(-MAX_HISTORY), present: next, future: [] };
    });
  }, []);
  const undo = useCallback(() => {
    last.current = null;
    setHist((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
  }, []);
  const redo = useCallback(() => {
    last.current = null;
    setHist((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
  }, []);

  /* ---------- restore + auto save (this device only) ---------- */
  useEffect(() => {
    setMounted(true);
    let alive = true;
    (async () => {
      const savedProject = sanitizeProject(await loadProject());
      let start = savedProject;
      if (!start) {
               const old = loadPref<Partial<OldSaved>>(OLD_KEY, {});
        if (old.title?.trim() || (old.text?.trim() && old.text.trim() !== "#spb")) {
          start = {
            ...DEFAULT_PROJECT,
            title: old.title || DEFAULT_PROJECT.title,
            font: old.fontId && old.fontId !== "site" ? old.fontId : "",
            docSize: old.canvasSize === "square" || old.canvasSize === "story" ? old.canvasSize : "a4",
            blocks: [
              { ...(newBlock("heading", "doc") as Block & { type: "heading" }), text: old.title || "" },
              { ...(newBlock("text", "doc") as Block & { type: "text" }), text: old.text || "", style: { ...defaultStyle("text", "doc"), size: Math.round((old.fontSize || 22) * 0.75) } },
            ],
          };
        }
      }
      if (alive && start) setHist({ past: [], present: start, future: [] });
      const m = await loadMusic();
      if (alive && m?.blob) setMusic(m);
      restored.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    const id = setTimeout(async () => setSaved((await saveProject(p)) ? "ok" : "fail"), 800);
    return () => clearTimeout(id);
  }, [p]);

  /* old saves kept a font id ("mandali-regular") — turn it into the font name */
  useEffect(() => {
    if (!fonts.length || !p.font || fonts.some((f) => f.value === p.font)) return;
    const f = findFont(p.font);
    if (f) setHist((h) => ({ ...h, present: { ...h.present, font: f.value } }));
  }, [fonts, p.font]);

  /* ---------- fonts + pictures: redraw when they arrive ---------- */
  const usedKey = mounted ? fontsUsed(p).join("|") : "";
  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    for (const v of usedKey.split("|").filter(Boolean)) void loadTeluguFont(v).then(() => alive && bump());
    return () => {
      alive = false;
    };
  }, [usedKey, mounted, bump]);
  useEffect(() => {
    if (!mounted) return;
    const fontsSet = document.fonts;
    fontsSet.addEventListener?.("loadingdone", bump);
    const off = onImageLoad(bump);
    return () => {
      fontsSet.removeEventListener?.("loadingdone", bump);
      off();
    };
  }, [mounted, bump]);

  /* music file → playable URL */
  useEffect(() => {
    if (!music) return setMusicUrl(null);
    const u = URL.createObjectURL(music.blob);
    setMusicUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [music]);
  const changeMusic = (m: Music | null) => {
    setMusic(m);
    void saveMusic(m);
  };

  /* ---------- layout (same engine as the files) ---------- */
  const deferred = useDeferredValue(p);
  const layout = useMemo(() => (mounted ? layoutProject(deferred) : null), [deferred, mounted, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const theme = getTheme(p.theme);

  const slideIdx = Math.min(slide, Math.max(0, p.slides.length - 1));
  const blocks = p.mode === "doc" ? p.blocks : p.slides[slideIdx]?.blocks ?? [];

  const setBlocks = useCallback(
    (fn: (b: Block[]) => Block[], key?: string) =>
      commit((x) => (x.mode === "doc" ? { ...x, blocks: fn(x.blocks) } : { ...x, slides: x.slides.map((s, i) => (i === slideIdx ? { ...s, blocks: fn(s.blocks) } : s)) }), key),
    [commit, slideIdx]
  );

  const change = (id: string, part: Partial<Block>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...part } as Block) : b)), "text" in part || "rows" in part || "caption" in part ? `type-${id}` : undefined);

  const move = (id: string, d: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const j = i + d;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const c = [...bs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  /* scroll to a block and put the cursor in its writing box (waits until it is on screen) */
  const focusBlock = (id: string, tries = 8) =>
    setTimeout(() => {
      const el = document.getElementById(`blk-${id}`);
      if (!el) return tries > 0 && focusBlock(id, tries - 1);
      el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      // writing box first, then a field, then a button (e.g. "చిత్రం ఎంచుకోండి")
      const target = ["textarea:not([aria-hidden])", "input:not([hidden]):not([type=hidden]):not([aria-hidden])", "button"]
        .map((q) => el.querySelector<HTMLElement>(`[data-block-input] ${q}`))
        .find(Boolean);
      target?.focus({ preventScroll: true });
    }, 60);

  const add = (t: BlockType) => {
    const b = newBlock(t, p.mode);
    setBlocks((bs) => {
      const i = selected ? bs.findIndex((x) => x.id === selected) : -1;
      return i < 0 ? [...bs, b] : [...bs.slice(0, i + 1), b, ...bs.slice(i + 1)];
    });
    setSelected(b.id);
    focusBlock(b.id);
  };

  const remove = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setSelected(blocks[i + 1]?.id ?? blocks[i - 1]?.id ?? null);
    setToast({ text: "తీసివేశాం.", undo: true });
  };

  const duplicate = (id: string) => {
    const src = blocks.find((b) => b.id === id);
    if (!src) return;
    const copy = cloneBlock(src);
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      return [...bs.slice(0, i + 1), copy, ...bs.slice(i + 1)];
    });
    setSelected(copy.id);
  };

  const pick = (id: string) => {
    setSelected(id);
    if (!desktop) setTab("edit");
    focusBlock(id);
  };

  /* Ctrl+Z / Ctrl+Y outside text boxes (inside them the browser's own undo works) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input, [contenteditable=true]")) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const closeShow = useCallback(() => setShow(null), []);
  const pageCount = layout?.pages.length ?? 1;

  /* ---------- pieces ---------- */

  const editor = (
    <Stack spacing={1.5}>
      {p.mode === "slides" && layout && (
        <Box sx={{ p: 1.5, borderRadius: "14px", bgcolor: "var(--surface)", border: "1px solid var(--border-strong)" }}>
          <SlidesBar p={p} layout={layout} current={slideIdx} tick={tick} onCurrent={(i) => (setSlide(i), setSelected(null))} set={commit} />
        </Box>
      )}
      {blocks.length === 0 && (
        <Typography sx={{ p: 2, textAlign: "center", color: "var(--muted-text)", border: "2px dashed var(--border-strong)", borderRadius: "12px" }}>
          ఇంకా ఏమీ లేదు — కింద "శీర్షిక" లేదా "పేరా" నొక్కండి.
        </Typography>
      )}
      {blocks.map((b, i) => (
        <BlockCard
          key={b.id}
          b={b}
          index={i}
          count={blocks.length}
          selected={selected === b.id}
          theme={theme}
          docFont={p.font}
          onSelect={() => selected !== b.id && setSelected(b.id)}
          onChange={(part) => change(b.id, part)}
          onMove={(d) => move(b.id, d)}
          onDuplicate={() => duplicate(b.id)}
          onDelete={() => remove(b.id)}
          onError={setError}
        />
      ))}
      <Box sx={{ pt: 1 }}>
        <AddBar mode={p.mode} onAdd={add} />
      </Box>
    </Stack>
  );

  const design = <DesignPanel p={p} set={commit} music={music} onMusic={changeMusic} onError={setError} tick={tick} />;

  const preview = layout ? (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        {p.mode === "slides" ? (
          <Button variant="contained" startIcon={<PlayCircleFilledRoundedIcon />} onClick={() => setShow({ start: slideIdx, autoplay: true })} sx={{ minHeight: 52, fontWeight: 800, textTransform: "none", bgcolor: "#b4470c", "&:hover": { bgcolor: "#913908" } }}>
            స్లైడ్ షో చూడండి{music ? " 🎵" : ""}
          </Button>
        ) : (
          <Button variant="outlined" startIcon={<FullscreenRoundedIcon />} onClick={() => setShow({ start: 0, autoplay: false })} sx={{ minHeight: 52, fontWeight: 700, textTransform: "none" }}>
            పూర్తి తెరలో చూడండి
          </Button>
        )}
        <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => setExportOpen(true)} sx={{ minHeight: 52, fontWeight: 800, textTransform: "none", bgcolor: "var(--secondary)" }}>
          డౌన్‌లోడ్
        </Button>
      </Stack>
      <Preview layout={layout} project={deferred} tick={tick} selected={selected} onPick={pick} only={p.mode === "slides" ? slideIdx : undefined} />
      {p.mode === "slides" && (
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 1.5 }}>
          <Button variant="outlined" disabled={slideIdx === 0} onClick={() => (setSlide(slideIdx - 1), setSelected(null))} sx={{ minHeight: 48, minWidth: 96, textTransform: "none", fontWeight: 700 }}>
            ◀ వెనుక
          </Button>
          <Typography sx={{ fontWeight: 800 }}>
            {slideIdx + 1} / {p.slides.length}
          </Typography>
          <Button variant="outlined" disabled={slideIdx >= p.slides.length - 1} onClick={() => (setSlide(slideIdx + 1), setSelected(null))} sx={{ minHeight: 48, minWidth: 96, textTransform: "none", fontWeight: 700 }}>
            తర్వాత ▶
          </Button>
        </Stack>
      )}
      <Typography variant="body2" sx={{ mt: 1.5, color: "var(--muted-text)", textAlign: "center" }}>
        👆 పేజీలో ఏ భాగాన్ని నొక్కినా, దాన్ని మార్చే పెట్టె తెరుచుకుంటుంది.
      </Typography>
    </Box>
  ) : (
    <Box sx={{ aspectRatio: "210/297", bgcolor: "var(--surface)", borderRadius: "6px" }} aria-label="ముందు చూపు సిద్ధమవుతోంది" />
  );

  const tabBtn = { minHeight: 56, textTransform: "none" as const, fontWeight: 800, fontSize: "1.02rem" };

  return (
    <Card sx={{ overflow: "visible" }}>
      <CardContent sx={{ px: { xs: 1.5, sm: 2.5 } }}>
        {/* ---------- top bar ---------- */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem", flexShrink: 0 }}>
            ఖతి మాల
          </Typography>
          <TextField
            size="small"
            label="ఫైల్ పేరు"
            value={p.title}
            onChange={(e) => commit((x) => ({ ...x, title: e.target.value }), "title")}
            sx={{ flex: 1, minWidth: 160, "& .MuiInputBase-root": { minHeight: 48 } }}
          />
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Tooltip title="కొత్తది / మళ్ళీ మొదలు">
              <Button variant="outlined" startIcon={<NoteAddRoundedIcon />} onClick={() => setNewOpen(true)} sx={{ minHeight: 48, textTransform: "none", fontWeight: 700 }}>
                కొత్తది
              </Button>
            </Tooltip>
            <Tooltip title="వెనక్కి (Ctrl+Z)">
              <span>
                <IconButton aria-label="వెనక్కి (undo)" disabled={!hist.past.length} onClick={undo} sx={{ width: 48, height: 48, border: "1px solid var(--border-strong)" }}>
                  <UndoRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="ముందుకు (Ctrl+Y)">
              <span>
                <IconButton aria-label="ముందుకు (redo)" disabled={!hist.future.length} onClick={redo} sx={{ width: 48, height: 48, border: "1px solid var(--border-strong)" }}>
                  <RedoRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => setExportOpen(true)} disabled={!layout} sx={{ minHeight: 48, fontWeight: 800, textTransform: "none", bgcolor: "var(--secondary)" }}>
              డౌన్‌లోడ్
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, fontSize: "1rem" }}>
            {error}
          </Alert>
        )}

        {/* ---------- body ---------- */}
        {desktop ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)", gap: 3, alignItems: "start" }}>
            <Box>
              <Tabs value={tab === "preview" ? "edit" : tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2, borderBottom: "1px solid var(--border-strong)" }}>
                <Tab value="edit" icon={<EditRoundedIcon />} iconPosition="start" label="వ్రాయండి" sx={tabBtn} />
                <Tab value="design" icon={<PaletteRoundedIcon />} iconPosition="start" label="రూపం · ఫాంట్ · సైజు" sx={tabBtn} />
              </Tabs>
              {tab === "design" ? design : editor}
            </Box>
            <Box sx={{ position: "sticky", top: 84, maxHeight: "calc(100dvh - 100px)", overflowY: "auto", pr: 0.5, pb: 2 }}>{preview}</Box>
          </Box>
        ) : (
          <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2, borderBottom: "1px solid var(--border-strong)" }}>
              <Tab value="edit" icon={<EditRoundedIcon />} label="వ్రాయండి" sx={tabBtn} />
              <Tab value="design" icon={<PaletteRoundedIcon />} label="రూపం" sx={tabBtn} />
              <Tab value="preview" icon={<VisibilityRoundedIcon />} label="చూడండి" sx={tabBtn} />
            </Tabs>
            {tab === "edit" && editor}
            {tab === "design" && design}
            {tab === "preview" && preview}
            {tab !== "preview" && (
              <Button fullWidth variant="contained" startIcon={<VisibilityRoundedIcon />} onClick={() => setTab("preview")} sx={{ mt: 2.5, minHeight: 56, fontWeight: 800, fontSize: "1.05rem", textTransform: "none", bgcolor: "var(--secondary)" }}>
                ఎలా వచ్చిందో చూడండి / డౌన్‌లోడ్
              </Button>
            )}
          </Box>
        )}

        <Typography variant="body2" sx={{ display: "block", mt: 2, color: "var(--muted-text)" }}>
          {saved === "fail" ? "⚠️ ఈ బ్రౌజర్‌లో సేవ్ కావడం లేదు (private mode?). డౌన్‌లోడ్ చేసి ఉంచుకోండి." : "💾 మీ పని (చిత్రాలతో సహా) ఈ పరికరంలోనే ఆటోమేటిక్‌గా సేవ్ అవుతుంది — ఎక్కడికీ పంపము."}
        </Typography>
      </CardContent>

      {/* ---------- dialogs ---------- */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="sm" aria-labelledby="new-title">
        <DialogTitle id="new-title" sx={{ fontWeight: 800, pr: 7 }}>
          కొత్తగా మొదలుపెట్టండి
          <IconButton aria-label="మూసివేయండి" onClick={() => setNewOpen(false)} sx={{ position: "absolute", right: 8, top: 8, width: 48, height: 48 }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1.5, color: "var(--muted-text)" }}>ఇప్పుడున్నది పోదు — "వెనక్కి ↶" నొక్కితే తిరిగి వస్తుంది.</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
            {TEMPLATES.map((t) => (
              <Box
                key={t.id}
                component="button"
                type="button"
                onClick={() => {
                  commit(() => t.make());
                  setSelected(null);
                  setSlide(0);
                  setNewOpen(false);
                  setTab("edit");
                  setToast({ text: `"${t.label}" తో కొత్తగా మొదలైంది.`, undo: true });
                }}
                sx={{ textAlign: "left", p: 1.75, minHeight: 72, borderRadius: "12px", cursor: "pointer", font: "inherit", color: "var(--foreground)", bgcolor: "var(--surface-elevated)", border: "1px solid var(--border-strong)", "&:hover": { borderColor: "var(--secondary)" }, "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 } }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{t.label}</Typography>
                <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
                  {t.hint}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {layout && <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} project={p} pageCount={pageCount} />}

      {show && layout && <Slideshow layout={layout} project={deferred} start={show.start} autoplay={show.autoplay} musicUrl={show.autoplay ? musicUrl : null} onClose={closeShow} />}

      <Snackbar
        open={!!toast}
        autoHideDuration={6000}
        onClose={(_, r) => r !== "clickaway" && setToast(null)}
        message={toast?.text}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 96, sm: 72 } }}
        ContentProps={{ sx: { fontSize: "1.05rem" } }}
        action={
          toast?.undo ? (
            <Button
              onClick={() => {
                undo();
                setToast(null);
              }}
              sx={{ color: "var(--accent-light)", fontWeight: 800, minHeight: 44, textTransform: "none" }}
            >
              ↶ వెనక్కి
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}
