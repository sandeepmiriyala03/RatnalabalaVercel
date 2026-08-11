"use client";

/**
 * ChitramalaCanvaEditor
 * -----------------------------------------------------------------------
 * A Canva-style poster editor for Telugu poems.
 * - Drag any element (title / poem / poet name / custom credit) anywhere
 * - Upload your own background image, control its opacity/blur
 * - Pick from color/gradient backgrounds or templates
 * - Per-element font, size, color, alignment
 * - Undo / redo history
 * - Export to PNG (multiple aspect ratios: square / story / landscape)
 *
 * No branding is hard-coded onto the poster — everything the end user
 * sees on the canvas is something they placed there themselves.
 * -----------------------------------------------------------------------
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Slider,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  TextField,
  Popover,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { toPng } from "html-to-image";

/* ============================================================
   TYPES
   ============================================================ */

type ElementId = string;

type PosterElement = {
  id: ElementId;
  kind: "title" | "poem" | "poet" | "credit" | "custom";
  text: string;
  x: number; // percentage 0-100, relative to canvas
  y: number; // percentage 0-100
  fontSize: number; // px baseline before canvas scale
  color: string;
  align: "left" | "center" | "right";
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  visible: boolean;
  maxWidth: number; // percentage 0-100
};

type BgMode = "color" | "gradient" | "image";

type CanvasState = {
  elements: PosterElement[];
  bgMode: BgMode;
  bgColor: string;
  bgGradient: string;
  bgImage: string | null; // data URL
  bgImageOpacity: number;
  bgImageBlur: number;
  overlayColor: string;
  overlayOpacity: number;
  aspect: "1/1" | "4/5" | "9/16" | "16/9";
};

/* ============================================================
   TEMPLATES — one-click starting points
   ============================================================ */

const TEMPLATES: { name: string; state: Partial<CanvasState> }[] = [
  {
    name: "క్లాసిక్ లేఖ",
    state: {
      bgMode: "color",
      bgColor: "#fffdf5",
      overlayOpacity: 0,
    },
  },
  {
    name: "మోడర్న్ మినిమల్",
    state: {
      bgMode: "color",
      bgColor: "#0f172a",
      overlayOpacity: 0,
    },
  },
  {
    name: "పండుగ గోల్డ్",
    state: {
      bgMode: "gradient",
      bgGradient: "linear-gradient(135deg,#7c2d12,#b45309,#78350f)",
      overlayOpacity: 0,
    },
  },
  {
    name: "ఆకాశనీలం",
    state: {
      bgMode: "gradient",
      bgGradient: "linear-gradient(160deg,#0ea5e9,#1e3a8a)",
      overlayOpacity: 0,
    },
  },
];

const ASPECTS: { key: CanvasState["aspect"]; label: string }[] = [
  { key: "1/1", label: "స్క్వేర్ (Post)" },
  { key: "4/5", label: "పోర్ట్రెయిట్" },
  { key: "9/16", label: "స్టోరీ" },
  { key: "16/9", label: "ల్యాండ్‌స్కేప్" },
];

const FONT_CHOICES = [
  "'Noto Serif Telugu', serif",
  "'Noto Sans Telugu', sans-serif",
  "'Ramabhadra', serif",
  "'Mallanna', sans-serif",
];

const uid = () => Math.random().toString(36).slice(2, 10);

function makeDefaultState(title: string, poet: string, poemLines: string[]): CanvasState {
  return {
    bgMode: "color",
    bgColor: "#fffdf5",
    bgGradient: "linear-gradient(135deg,#7c2d12,#b45309,#78350f)",
    bgImage: null,
    bgImageOpacity: 1,
    bgImageBlur: 0,
    overlayColor: "#000000",
    overlayOpacity: 0,
    aspect: "4/5",
    elements: [
      {
        id: uid(),
        kind: "title",
        text: title || "శీర్షిక",
        x: 50,
        y: 12,
        fontSize: 28,
        color: "#111111",
        align: "center",
        fontFamily: FONT_CHOICES[0],
        bold: true,
        italic: false,
        visible: !!title,
        maxWidth: 80,
      },
      {
        id: uid(),
        kind: "poem",
        text: poemLines.join("\n"),
        x: 50,
        y: 50,
        fontSize: 20,
        color: "#1a1a1a",
        align: "center",
        fontFamily: FONT_CHOICES[0],
        bold: false,
        italic: false,
        visible: true,
        maxWidth: 85,
      },
      {
        id: uid(),
        kind: "poet",
        text: poet ? `— ${poet}` : "",
        x: 78,
        y: 82,
        fontSize: 16,
        color: "#444444",
        align: "right",
        fontFamily: FONT_CHOICES[0],
        bold: false,
        italic: true,
        visible: !!poet,
        maxWidth: 40,
      },
      {
        id: uid(),
        kind: "credit",
        text: "",
        x: 50,
        y: 94,
        fontSize: 12,
        color: "#888888",
        align: "center",
        fontFamily: FONT_CHOICES[0],
        bold: false,
        italic: false,
        visible: false,
        maxWidth: 90,
      },
    ],
  };
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

type Props = {
  title?: string;
  poet?: string;
  lines: string[];
};

export default function ChitramalaCanvaEditor({ title, poet, lines }: Props) {
  const initial = useMemo(() => makeDefaultState(title ?? "", poet ?? "", lines), []); // eslint-disable-line

  const [history, setHistory] = useState<CanvasState[]>([initial]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const state = history[historyIndex];

  const [selectedId, setSelectedId] = useState<ElementId | null>(state.elements[1]?.id ?? null);
  const [tab, setTab] = useState<"design" | "text" | "layers">("design");

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dragInfo = useRef<{ id: ElementId; startX: number; startY: number; origX: number; origY: number } | null>(null);

  /* ---------- state update helper (pushes new history entry) ---------- */
  const commit = useCallback(
    (updater: (prev: CanvasState) => CanvasState) => {
      setHistory((h) => {
        const next = updater(h[historyIndex]);
        const trimmed = h.slice(0, historyIndex + 1);
        return [...trimmed, next];
      });
      setHistoryIndex((i) => i + 1);
    },
    [historyIndex]
  );

  const undo = () => setHistoryIndex((i) => Math.max(0, i - 1));
  const redo = () => setHistoryIndex((i) => Math.min(history.length - 1, i + 1));

  const updateElement = (id: ElementId, patch: Partial<PosterElement>) =>
    commit((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    }));

  const selected = state.elements.find((e) => e.id === selectedId) || null;

  /* ---------- drag handling ---------- */
  const onPointerDown = (e: React.PointerEvent, id: ElementId) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = state.elements.find((x) => x.id === id);
    if (!el) return;
    dragInfo.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragInfo.current.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragInfo.current.startY) / rect.height) * 100;
    const nx = Math.min(98, Math.max(2, dragInfo.current.origX + dxPct));
    const ny = Math.min(98, Math.max(2, dragInfo.current.origY + dyPct));
    setHistory((h) => {
      const copy = [...h];
      copy[historyIndex] = {
        ...copy[historyIndex],
        elements: copy[historyIndex].elements.map((el) =>
          el.id === dragInfo.current!.id ? { ...el, x: nx, y: ny } : el
        ),
      };
      return copy;
    });
  };

  const onPointerUp = () => {
    dragInfo.current = null;
  };

  /* ---------- background image upload ---------- */
  const onBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      commit((prev) => ({ ...prev, bgMode: "image", bgImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  /* ---------- add a new custom text block ---------- */
  const addCustomBlock = () =>
    commit((prev) => ({
      ...prev,
      elements: [
        ...prev.elements,
        {
          id: uid(),
          kind: "custom",
          text: "కొత్త టెక్స్ట్",
          x: 50,
          y: 60,
          fontSize: 18,
          color: "#222222",
          align: "center",
          fontFamily: FONT_CHOICES[0],
          bold: false,
          italic: false,
          visible: true,
          maxWidth: 70,
        },
      ],
    }));

  const removeElement = (id: ElementId) =>
    commit((prev) => ({ ...prev, elements: prev.elements.filter((e) => e.id !== id) }));

  const applyTemplate = (patch: Partial<CanvasState>) => commit((prev) => ({ ...prev, ...patch }));

  /* ---------- export ---------- */
  const [exportAspect, setExportAspect] = useState<CanvasState["aspect"]>(state.aspect);
  const download = async () => {
    if (!canvasRef.current) return;
    setSelectedId(null); // hide selection outline for clean export
    await new Promise((r) => setTimeout(r, 50));
    await document.fonts.ready;
    const url = await toPng(canvasRef.current, { pixelRatio: 3, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `poem-poster-${Date.now()}.png`;
    a.click();
  };

  const backgroundStyle: React.CSSProperties =
    state.bgMode === "image" && state.bgImage
      ? {
          backgroundImage: `url(${state.bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : state.bgMode === "gradient"
      ? { background: state.bgGradient }
      : { background: state.bgColor };

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ width: "100%" }}>
      {/* ============ CANVAS ============ */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, alignSelf: "flex-start" }}>
          <Tooltip title="అన్‌డు">
            <span>
              <IconButton size="small" onClick={undo} disabled={historyIndex === 0}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="రీడు">
            <span>
              <IconButton size="small" onClick={redo} disabled={historyIndex === history.length - 1}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Select size="small" value={state.aspect} onChange={(e) => applyTemplate({ aspect: e.target.value as CanvasState["aspect"] })}>
            {ASPECTS.map((a) => (
              <MenuItem key={a.key} value={a.key}>{a.label}</MenuItem>
            ))}
          </Select>
        </Stack>

        <Box
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => setSelectedId(null)}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 480,
            aspectRatio: state.aspect,
            overflow: "hidden",
            borderRadius: 2,
            boxShadow: 3,
            ...backgroundStyle,
          }}
        >
          {state.bgMode === "image" && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backdropFilter: `blur(${state.bgImageBlur}px)`,
                background: state.overlayColor,
                opacity: state.overlayOpacity,
              }}
            />
          )}

          {state.elements
            .filter((el) => el.visible)
            .map((el) => (
              <Box
                key={el.id}
                onPointerDown={(e) => onPointerDown(e, el.id)}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: "absolute",
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  transform: "translate(-50%, -50%)",
                  maxWidth: `${el.maxWidth}%`,
                  cursor: "grab",
                  userSelect: "none",
                  whiteSpace: "pre-line",
                  textAlign: el.align,
                  fontFamily: el.fontFamily,
                  fontSize: el.fontSize,
                  color: el.color,
                  fontWeight: el.bold ? 700 : 400,
                  fontStyle: el.italic ? "italic" : "normal",
                  lineHeight: 1.5,
                  outline: selectedId === el.id ? "2px dashed #2563eb" : "none",
                  outlineOffset: 4,
                  padding: "2px 4px",
                }}
              >
                {el.text || " "}
              </Box>
            ))}
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={download}
          sx={{ mt: 2 }}
        >
          పోస్టర్ డౌన్‌లోడ్
        </Button>
      </Box>

      {/* ============ SIDE PANEL ============ */}
      <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab value="design" label="డిజైన్" icon={<FormatColorFillIcon fontSize="small" />} iconPosition="start" />
          <Tab value="text" label="టెక్స్ట్" icon={<TextFieldsIcon fontSize="small" />} iconPosition="start" />
          <Tab value="layers" label="లేయర్స్" />
        </Tabs>

        {/* ---- DESIGN TAB ---- */}
        {tab === "design" && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Box sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>టెంప్లేట్‌లు</Box>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {TEMPLATES.map((t) => (
                  <Button key={t.name} size="small" variant="outlined" onClick={() => applyTemplate(t.state)}>
                    {t.name}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box>
              <Box sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>బ్యాక్‌గ్రౌండ్</Box>
              <ButtonGroup size="small" sx={{ mb: 1 }}>
                <Button variant={state.bgMode === "color" ? "contained" : "outlined"} onClick={() => applyTemplate({ bgMode: "color" })}>రంగు</Button>
                <Button variant={state.bgMode === "gradient" ? "contained" : "outlined"} onClick={() => applyTemplate({ bgMode: "gradient" })}>గ్రేడియంట్</Button>
                <Button variant={state.bgMode === "image" ? "contained" : "outlined"} onClick={() => fileInputRef.current?.click()}>
                  ఫోటో
                </Button>
              </ButtonGroup>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onBgFile} />

              {state.bgMode === "color" && (
                <input
                  type="color"
                  value={state.bgColor}
                  onChange={(e) => applyTemplate({ bgColor: e.target.value })}
                  style={{ width: "100%", height: 36 }}
                />
              )}

              {state.bgMode === "image" && state.bgImage && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Box sx={{ fontSize: 12 }}>ఓవర్‌లే అపారదర్శకత</Box>
                  <Slider
                    size="small"
                    min={0}
                    max={1}
                    step={0.05}
                    value={state.overlayOpacity}
                    onChange={(_, v) => applyTemplate({ overlayOpacity: v as number })}
                  />
                  <Box sx={{ fontSize: 12 }}>బ్లర్</Box>
                  <Slider
                    size="small"
                    min={0}
                    max={12}
                    value={state.bgImageBlur}
                    onChange={(_, v) => applyTemplate({ bgImageBlur: v as number })}
                  />
                </Stack>
              )}
            </Box>

            <Button size="small" startIcon={<AddIcon />} onClick={addCustomBlock}>
              కొత్త టెక్స్ట్ బ్లాక్ చేర్చు
            </Button>
          </Stack>
        )}

        {/* ---- TEXT TAB (edits the selected element) ---- */}
        {tab === "text" && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {!selected && <Box sx={{ fontSize: 13, color: "text.secondary" }}>పోస్టర్‌లో ఒక టెక్స్ట్ ఎంచుకోండి</Box>}
            {selected && (
              <>
                <TextField
                  multiline
                  minRows={2}
                  size="small"
                  value={selected.text}
                  onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                />
                <Select size="small" value={selected.fontFamily} onChange={(e) => updateElement(selected.id, { fontFamily: e.target.value })}>
                  {FONT_CHOICES.map((f) => (
                    <MenuItem key={f} value={f} style={{ fontFamily: f }}>{f.split(",")[0]}</MenuItem>
                  ))}
                </Select>

                <Box sx={{ fontSize: 12 }}>అక్షర పరిమాణం: {selected.fontSize}px</Box>
                <Slider size="small" min={10} max={64} value={selected.fontSize} onChange={(_, v) => updateElement(selected.id, { fontSize: v as number })} />

                <input type="color" value={selected.color} onChange={(e) => updateElement(selected.id, { color: e.target.value })} style={{ width: "100%", height: 32 }} />

                <ButtonGroup size="small">
                  {(["left", "center", "right"] as const).map((a) => (
                    <Button key={a} variant={selected.align === a ? "contained" : "outlined"} onClick={() => updateElement(selected.id, { align: a })}>
                      {a === "left" ? "ఎడమ" : a === "center" ? "మధ్య" : "కుడి"}
                    </Button>
                  ))}
                </ButtonGroup>

                <ButtonGroup size="small">
                  <Button variant={selected.bold ? "contained" : "outlined"} onClick={() => updateElement(selected.id, { bold: !selected.bold })}>B</Button>
                  <Button variant={selected.italic ? "contained" : "outlined"} onClick={() => updateElement(selected.id, { italic: !selected.italic })}>I</Button>
                </ButtonGroup>
              </>
            )}
          </Stack>
        )}

        {/* ---- LAYERS TAB ---- */}
        {tab === "layers" && (
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            {state.elements.map((el) => (
              <Stack
                key={el.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: selectedId === el.id ? "action.selected" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedId(el.id)}
              >
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}>
                  {el.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                </IconButton>
                <Box sx={{ flex: 1, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {el.text || `(ఖాళీ ${el.kind})`}
                </Box>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}