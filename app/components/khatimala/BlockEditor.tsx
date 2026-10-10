"use client";

/* ═══════════════════════════════════════════════════════════════
   పెట్టెలు (blocks) — Word లాగా: ఎంచుకున్న పెట్టెకు ఫాంట్, సైజు,
   B / I / U, ఎడమ-మధ్య-కుడి-సమం, రంగు, పంక్తి దూరం.
   వ్రాసే పెట్టె కూడా అదే ఫాంట్ / అమరిక / రంగుతో — ఏం వస్తుందో వెంటనే.
   ═══════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import FormatAlignLeftRoundedIcon from "@mui/icons-material/FormatAlignLeftRounded";
import FormatAlignCenterRoundedIcon from "@mui/icons-material/FormatAlignCenterRounded";
import FormatAlignRightRoundedIcon from "@mui/icons-material/FormatAlignRightRounded";
import FormatAlignJustifyRoundedIcon from "@mui/icons-material/FormatAlignJustifyRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import InsertPageBreakRoundedIcon from "@mui/icons-material/InsertPageBreakRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { BLOCK_LABEL, isStyled, type Block, type BlockType, type ImageBlock, type Mode, type TableBlock, type TextStyle } from "./model";
import type { Theme } from "./themes";
import FontPicker, { cssStack } from "./FontPicker";
import { readPicture } from "./storage";

export const SIZE_PRESETS = [10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 84, 96];
const LINE_HEIGHTS = [1.2, 1.45, 1.7, 2, 2.4];
const COLORS: (string | null)[] = [null, "#1a1a1a", "#5a2509", "#a31515", "#9c0f4c", "#6a1b9a", "#0b3d91", "#1b5e20", "#8a6508", "#ffffff"];

export const BLOCK_ICON: Record<BlockType, React.ReactNode> = {
  heading: <TitleRoundedIcon />,
  text: <NotesRoundedIcon />,
  quote: <FormatQuoteRoundedIcon />,
  list: <FormatListBulletedRoundedIcon />,
  table: <TableChartRoundedIcon />,
  image: <ImageRoundedIcon />,
  divider: <HorizontalRuleRoundedIcon />,
  pagebreak: <InsertPageBreakRoundedIcon />,
};

const tb = { minWidth: 44, minHeight: 44, px: 1 };

/* ─────────────────────────────────────────────────────────────── */
/* STYLE TOOLBAR                                                      */
/* ─────────────────────────────────────────────────────────────── */

function StyleBar({ s, onChange, theme, defaultColor }: { s: TextStyle; onChange: (s: Partial<TextStyle>) => void; theme: Theme; defaultColor: string }) {
  const step = s.size >= 40 ? 4 : 2;
  return (
    <Stack spacing={1.25} sx={{ mb: 1.5 }}>
      <FontPicker compact allowDoc value={s.font} onChange={(font) => onChange({ font })} label="ఈ పెట్టె ఫాంట్" />
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} alignItems="center">
        {/* size */}
        <Stack direction="row" alignItems="center" sx={{ border: "1px solid var(--border-strong)", borderRadius: "10px", bgcolor: "var(--surface-elevated)" }}>
          <Tooltip title="అక్షరాలు చిన్నగా">
            <IconButton aria-label="అక్షరాలు చిన్నగా" onClick={() => onChange({ size: Math.max(8, s.size - step) })} sx={{ width: 44, height: 44 }}>
              <RemoveRoundedIcon />
            </IconButton>
          </Tooltip>
          <Select
            size="small"
            variant="standard"
            disableUnderline
            value={SIZE_PRESETS.includes(s.size) ? s.size : ""}
            displayEmpty
            renderValue={() => <b>{s.size}</b>}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
            inputProps={{ "aria-label": "అక్షర సైజు" }}
            sx={{ minWidth: 52, textAlign: "center", "& .MuiSelect-select": { py: 1, pr: "22px !important", pl: 1 } }}
          >
            {SIZE_PRESETS.map((n) => (
              <MenuItem key={n} value={n} sx={{ minHeight: 44 }}>
                {n}
              </MenuItem>
            ))}
          </Select>
          <Tooltip title="అక్షరాలు పెద్దగా">
            <IconButton aria-label="అక్షరాలు పెద్దగా" onClick={() => onChange({ size: Math.min(160, s.size + step) })} sx={{ width: 44, height: 44 }}>
              <AddRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* B I U */}
        <ToggleButtonGroup size="small" aria-label="అక్షర శైలి" sx={{ bgcolor: "var(--surface-elevated)" }}>
          <ToggleButton value="b" selected={s.bold} onChange={() => onChange({ bold: !s.bold })} aria-label="బోల్డ్ (లావు అక్షరాలు)" sx={tb}>
            <FormatBoldRoundedIcon />
          </ToggleButton>
          <ToggleButton value="i" selected={s.italic} onChange={() => onChange({ italic: !s.italic })} aria-label="ఇటాలిక్ (వాలు అక్షరాలు)" sx={tb}>
            <FormatItalicRoundedIcon />
          </ToggleButton>
          <ToggleButton value="u" selected={s.underline} onChange={() => onChange({ underline: !s.underline })} aria-label="అడుగు గీత" sx={tb}>
            <FormatUnderlinedRoundedIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* align */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={s.align}
          onChange={(_, v) => v && onChange({ align: v })}
          aria-label="అమరిక"
          sx={{ bgcolor: "var(--surface-elevated)" }}
        >
          <ToggleButton value="left" aria-label="ఎడమ వైపు" sx={tb}>
            <FormatAlignLeftRoundedIcon />
          </ToggleButton>
          <ToggleButton value="center" aria-label="మధ్యలో" sx={tb}>
            <FormatAlignCenterRoundedIcon />
          </ToggleButton>
          <ToggleButton value="right" aria-label="కుడి వైపు" sx={tb}>
            <FormatAlignRightRoundedIcon />
          </ToggleButton>
          <ToggleButton value="justify" aria-label="రెండు వైపులా సమంగా" sx={tb}>
            <FormatAlignJustifyRoundedIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* line spacing */}
        <Select
          size="small"
          value={LINE_HEIGHTS.includes(s.lineHeight) ? s.lineHeight : 1.7}
          onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
          inputProps={{ "aria-label": "పంక్తుల మధ్య దూరం" }}
          renderValue={(v) => `↕ ${v}`}
          sx={{ minHeight: 44, bgcolor: "var(--surface-elevated)" }}
        >
          {LINE_HEIGHTS.map((n) => (
            <MenuItem key={n} value={n} sx={{ minHeight: 44 }}>
              పంక్తి దూరం {n}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* colours */}
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} alignItems="center" role="radiogroup" aria-label="అక్షరాల రంగు">
        <Typography variant="body2" sx={{ fontWeight: 700, mr: 0.5 }}>
          రంగు:
        </Typography>
        {COLORS.map((c) => {
          const active = s.color === c;
          const shown = c ?? defaultColor;
          return (
            <Tooltip key={c ?? "theme"} title={c ? c : "రూపం (theme) రంగు"}>
              <Box
                component="button"
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={c ? `రంగు ${c}` : "రూపం రంగు (అసలు)"}
                onClick={() => onChange({ color: c })}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  cursor: "pointer",
                  bgcolor: shown,
                  border: active ? "3px solid var(--focus-ring)" : "2px solid var(--border-strong)",
                  outlineOffset: 2,
                  position: "relative",
                  "&:focus-visible": { outline: "3px solid var(--focus-ring)" },
                  ...(c === null ? { "&::after": { content: '"అ"', position: "absolute", inset: 0, display: "grid", placeItems: "center", color: theme.bg[0], fontSize: 15, fontWeight: 800 } } : {}),
                }}
              />
            </Tooltip>
          );
        })}
        <Tooltip title="వేరే రంగు">
          <Box
            component="input"
            type="color"
            aria-label="వేరే రంగు ఎంచుకోండి"
            value={s.color ?? "#000000"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ color: e.target.value })}
            sx={{ width: 40, height: 40, p: 0, border: "2px solid var(--border-strong)", borderRadius: "8px", bgcolor: "transparent", cursor: "pointer" }}
          />
        </Tooltip>
      </Stack>
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* TABLE                                                              */
/* ─────────────────────────────────────────────────────────────── */

function TableEditor({ b, onChange, font }: { b: TableBlock; onChange: (b: Partial<TableBlock>) => void; font: string }) {
  const cols = Math.max(1, ...b.rows.map((r) => r.length));
  const setCell = (ri: number, ci: number, v: string) => onChange({ rows: b.rows.map((r, i) => (i === ri ? Array.from({ length: cols }, (_, j) => (j === ci ? v : r[j] ?? "")) : r)) });
  const btn = { textTransform: "none" as const, fontWeight: 700, minHeight: 44 };
  return (
    <Box>
      <Box data-telugu-font="" sx={{ overflowX: "auto", pb: 1 }}>
        <Box component="table" sx={{ borderCollapse: "collapse", minWidth: cols * 130 }}>
          <tbody>
            {b.rows.map((row, ri) => (
              <tr key={ri}>
                {Array.from({ length: cols }, (_, ci) => (
                  <Box component="td" key={ci} sx={{ p: 0.25, minWidth: 120 }}>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      value={row[ci] ?? ""}
                      onChange={(e) => setCell(ri, ci, e.target.value)}
                      inputProps={{ "aria-label": `వరుస ${ri + 1}, నిలువు ${ci + 1}` }}
                      sx={{ "& .MuiInputBase-root": { fontFamily: font, fontSize: 17, fontWeight: b.header && ri === 0 ? 800 : 400, bgcolor: b.header && ri === 0 ? "var(--surface)" : "var(--surface-elevated)" } }}
                    />
                  </Box>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
        <Button size="small" variant="outlined" sx={btn} onClick={() => onChange({ rows: [...b.rows, Array(cols).fill("")] })}>
          + వరుస
        </Button>
        <Button size="small" variant="outlined" sx={btn} disabled={b.rows.length <= 1} onClick={() => onChange({ rows: b.rows.slice(0, -1) })}>
          − వరుస
        </Button>
        <Button size="small" variant="outlined" sx={btn} disabled={cols >= 8} onClick={() => onChange({ rows: b.rows.map((r) => [...r, ""]) })}>
          + నిలువు
        </Button>
        <Button size="small" variant="outlined" sx={btn} disabled={cols <= 1} onClick={() => onChange({ rows: b.rows.map((r) => r.slice(0, cols - 1)) })}>
          − నిలువు
        </Button>
        <FormControlLabel control={<Switch checked={b.header} onChange={(e) => onChange({ header: e.target.checked })} />} label="మొదటి వరుస శీర్షిక" />
      </Stack>
    </Box>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* IMAGE                                                              */
/* ─────────────────────────────────────────────────────────────── */

export function PictureButton({ onPicked, label, onError, variant = "contained" }: { onPicked: (p: Awaited<ReturnType<typeof readPicture>>) => void; label: string; onError: (m: string) => void; variant?: "contained" | "outlined" }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant={variant} startIcon={<ImageRoundedIcon />} onClick={() => ref.current?.click()} sx={{ textTransform: "none", fontWeight: 700, minHeight: 48 }}>
        {label}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            onPicked(await readPicture(f));
          } catch {
            onError("ఈ చిత్రం తెరవలేకపోయాం. JPG లేదా PNG చిత్రం ఎంచుకోండి.");
          }
        }}
      />
    </>
  );
}

function ImageEditor({ b, onChange, onError }: { b: ImageBlock; onChange: (b: Partial<ImageBlock>) => void; onError: (m: string) => void }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {b.src ? (
          <Box component="img" src={b.src} alt="ఎంచుకున్న చిత్రం" sx={{ width: 96, height: 72, objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-strong)" }} />
        ) : (
          <Box sx={{ width: 96, height: 72, borderRadius: "8px", border: "2px dashed var(--border-strong)", display: "grid", placeItems: "center", fontSize: 28 }} aria-hidden>
            📷
          </Box>
        )}
        <PictureButton label={b.src ? "చిత్రం మార్చండి" : "చిత్రం ఎంచుకోండి"} onPicked={(p) => onChange(p)} onError={onError} />
      </Stack>
      <Box>
        <Typography id={`w-${b.id}`} sx={{ fontWeight: 700 }}>
          వెడల్పు: {b.width}%
        </Typography>
        <Slider aria-labelledby={`w-${b.id}`} min={15} max={100} step={5} value={b.width} onChange={(_, v) => onChange({ width: v as number })} />
      </Box>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} alignItems="center">
        <ToggleButtonGroup size="small" exclusive value={b.align} onChange={(_, v) => v && onChange({ align: v })} aria-label="చిత్రం అమరిక">
          <ToggleButton value="left" aria-label="ఎడమ" sx={tb}>
            <FormatAlignLeftRoundedIcon />
          </ToggleButton>
          <ToggleButton value="center" aria-label="మధ్య" sx={tb}>
            <FormatAlignCenterRoundedIcon />
          </ToggleButton>
          <ToggleButton value="right" aria-label="కుడి" sx={tb}>
            <FormatAlignRightRoundedIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel control={<Switch checked={b.rounded} onChange={(e) => onChange({ rounded: e.target.checked })} />} label="గుండ్రని మూలలు" />
      </Stack>
      <TextField label="చిత్రం కింద వాక్యం (ఐచ్ఛికం)" value={b.caption} onChange={(e) => onChange({ caption: e.target.value })} fullWidth />
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ONE BLOCK CARD                                                     */
/* ─────────────────────────────────────────────────────────────── */

type CardProps = {
  b: Block;
  index: number;
  count: number;
  selected: boolean;
  theme: Theme;
  docFont: string;
  onSelect: () => void;
  onChange: (b: Partial<Block>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onError: (m: string) => void;
};

const PLACEHOLDER: Partial<Record<BlockType, string>> = {
  heading: "శీర్షిక వ్రాయండి",
  text: "ఇక్కడ వ్రాయండి…",
  quote: "పద్యం / సూక్తి — ప్రతి పాదం కొత్త లైన్‌లో",
  list: "ఒక్కో అంశం ఒక్కో లైన్‌లో",
};

export function BlockCard(p: CardProps) {
  const { b, selected, theme } = p;
  const s = isStyled(b) ? b.style : null;
  const family = cssStack(s?.font ?? p.docFont);
  const defaultColor = b.type === "heading" ? theme.heading : b.type === "image" ? theme.muted : theme.text;
  const editSize = s ? Math.min(34, Math.max(17, s.size * 0.95)) : 18;

  return (
    <Box
      onFocusCapture={p.onSelect}
      onClick={p.onSelect}
      id={`blk-${b.id}`}
      sx={{
        border: selected ? "3px solid var(--secondary)" : "1px solid var(--border-strong)",
        borderRadius: "14px",
        p: { xs: 1.25, sm: 1.75 },
        bgcolor: selected ? "var(--surface)" : "var(--surface-elevated)",
        scrollMarginTop: 96,
        transition: "border-color .15s",
      }}
    >
      <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap columnGap={0.5} sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", color: "var(--secondary)" }} aria-hidden>
          {BLOCK_ICON[b.type]}
        </Box>
        <Typography sx={{ fontWeight: 800, flex: "1 1 auto", minWidth: 118, fontSize: "1.02rem" }}>
          {BLOCK_LABEL[b.type]}
          <Typography component="span" variant="body2" sx={{ color: "var(--muted-text)", ml: 1 }}>
            {p.index + 1}/{p.count}
          </Typography>
        </Typography>
        <Tooltip title="పైకి జరపండి">
          <span>
            <IconButton aria-label={`${BLOCK_LABEL[b.type]} పైకి జరపండి`} disabled={p.index === 0} onClick={() => p.onMove(-1)} sx={{ width: 44, height: 44 }}>
              <ArrowUpwardRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="కిందికి జరపండి">
          <span>
            <IconButton aria-label={`${BLOCK_LABEL[b.type]} కిందికి జరపండి`} disabled={p.index === p.count - 1} onClick={() => p.onMove(1)} sx={{ width: 44, height: 44 }}>
              <ArrowDownwardRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="నకలు చేయండి">
          <IconButton aria-label={`${BLOCK_LABEL[b.type]} నకలు`} onClick={p.onDuplicate} sx={{ width: 44, height: 44 }}>
            <ContentCopyRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="తీసివేయండి">
          <IconButton aria-label={`${BLOCK_LABEL[b.type]} తీసివేయండి`} onClick={p.onDelete} sx={{ width: 44, height: 44, color: "#a31515" }}>
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {selected && s && <StyleBar s={s} theme={theme} defaultColor={defaultColor} onChange={(x) => p.onChange({ style: { ...s, ...x } } as Partial<Block>)} />}

      {(b.type === "heading" || b.type === "text" || b.type === "quote" || b.type === "list") && s && (
        <Box data-telugu-font="" data-block-input="" sx={{ fontFamily: family }}>
          {b.type === "list" && selected && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={b.ordered ? "num" : "dot"}
              onChange={(_, v) => v && p.onChange({ ordered: v === "num" } as Partial<Block>)}
              aria-label="జాబితా రకం"
              sx={{ mb: 1 }}
            >
              <ToggleButton value="dot" sx={{ ...tb, px: 1.5, textTransform: "none", fontWeight: 700 }}>
                ● చుక్కలు
              </ToggleButton>
              <ToggleButton value="num" sx={{ ...tb, px: 1.5, textTransform: "none", fontWeight: 700 }}>
                1. సంఖ్యలు
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          <TextField
            fullWidth
            multiline
            minRows={b.type === "heading" ? 1 : 3}
            value={b.text}
            placeholder={PLACEHOLDER[b.type]}
            onChange={(e) => p.onChange({ text: e.target.value } as Partial<Block>)}
            inputProps={{ "aria-label": BLOCK_LABEL[b.type], lang: "te", spellCheck: false }}
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: family,
                bgcolor: theme.bg[0],
                color: s.color ?? defaultColor,
                borderRadius: "10px",
                ...(b.type === "quote" ? { borderLeft: `5px solid ${theme.accent}` } : {}),
              },
              "& textarea": {
                fontSize: `${editSize}px`,
                lineHeight: Math.max(1.5, s.lineHeight),
                fontWeight: s.bold ? 700 : 400,
                fontStyle: s.italic ? "italic" : "normal",
                textDecoration: s.underline ? "underline" : "none",
                textAlign: s.align,
              },
              "& textarea::placeholder": { color: theme.muted, opacity: 1 },
              "& fieldset": { borderColor: "var(--border-strong)" },
            }}
          />
        </Box>
      )}

      {b.type === "table" && (
        <Box data-block-input="">
          <TableEditor b={b} onChange={(x) => p.onChange(x)} font={family} />
        </Box>
      )}
      {b.type === "image" && (
        <Box data-block-input="">
          <ImageEditor b={b} onChange={(x) => p.onChange(x)} onError={p.onError} />
        </Box>
      )}
      {b.type === "divider" && (
        <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
          పేజీలో ఒక అందమైన గీత (రూపం రంగులో).
        </Typography>
      )}
      {b.type === "pagebreak" && (
        <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
          దీని తర్వాతి భాగం కొత్త పేజీలో మొదలవుతుంది.
        </Typography>
      )}
    </Box>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ADD BAR                                                            */
/* ─────────────────────────────────────────────────────────────── */

export function AddBar({ mode, onAdd }: { mode: Mode; onAdd: (t: BlockType) => void }) {
  const types: BlockType[] = ["heading", "text", "quote", "list", "table", "image", "divider", ...(mode === "doc" ? (["pagebreak"] as BlockType[]) : [])];
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, mb: 1 }}>➕ కొత్తది జోడించండి</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1 }}>
        {types.map((t) => (
          <Button
            key={t}
            variant="outlined"
            onClick={() => onAdd(t)}
            startIcon={BLOCK_ICON[t]}
            sx={{ textTransform: "none", fontWeight: 700, minHeight: 52, justifyContent: "flex-start", bgcolor: "var(--surface-elevated)", fontSize: "1rem" }}
          >
            {BLOCK_LABEL[t]}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
