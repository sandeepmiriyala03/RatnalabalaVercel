"use client";

/* రూపం (Design) — పత్రమా / స్లైడ్ షోనా, పరిమాణం, 10 రూపాలు, ఫాంట్,
   పేజీ అమరిక, నేపథ్య చిత్రం, స్లైడ్ షో సమయం + సంగీతం */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { layoutProject, renderPage } from "./engine";
import { SIZES, type Mode, type Project, type SizeId } from "./model";
import { THEMES } from "./themes";
import FontPicker from "./FontPicker";
import { PictureButton } from "./BlockEditor";
import { MAX_MUSIC, type Music } from "./storage";

type Props = {
  p: Project;
  set: (fn: (p: Project) => Project) => void;
  music: Music | null;
  onMusic: (m: Music | null) => void;
  onError: (m: string) => void;
  tick: number;
};

const H = ({ children }: { children: React.ReactNode }) => (
  <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.12rem", mb: 1, mt: 0.5 }}>
    {children}
  </Typography>
);

/** Small picture of each theme in the chosen font */
function ThemeThumb({ themeId, p, tick }: { themeId: string; p: Project; tick: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const sample: Project = {
      ...p,
      theme: themeId,
      fit: true,
      vAlign: "middle",
      pageNumbers: false,
      footer: "",
      mode: "doc",
      docSize: p.mode === "doc" ? p.docSize : p.slideSize,
      blocks: [
        { id: "t1", type: "heading", text: "శీర్షిక", style: { align: "center", size: 120, bold: true, italic: false, underline: false, color: null, font: null, lineHeight: 1.4 } },
        { id: "t2", type: "text", text: "తెలుగు వెలుగు", style: { align: "center", size: 64, bold: false, italic: false, underline: false, color: null, font: null, lineHeight: 1.5 } },
      ],
    };
    const id = requestAnimationFrame(() => {
      const l = layoutProject(sample, true);
      const c = renderPage(l, 0, 220, { project: sample });
      setSrc(c.toDataURL("image/png"));
      c.width = c.height = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [themeId, p.font, p.mode, p.docSize, p.slideSize, p.bg, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return src ? <Box component="img" src={src} alt="" sx={{ width: "100%", display: "block", borderRadius: "6px" }} /> : <Box sx={{ aspectRatio: "1", bgcolor: "var(--surface)" }} />;
}

export default function DesignPanel({ p, set, music, onMusic, onError, tick }: Props) {
  const sizeKey: "docSize" | "slideSize" = p.mode === "doc" ? "docSize" : "slideSize";
  const sizes = useMemo(() => (Object.keys(SIZES) as SizeId[]).filter((k) => SIZES[k].modes.includes(p.mode)), [p.mode]);
  const musicRef = useRef<HTMLInputElement>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!music) return setMusicUrl(null);
    const u = URL.createObjectURL(music.blob);
    setMusicUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [music]);

  return (
    <Stack spacing={3}>
      <Box>
        <H>ఏం తయారు చేస్తున్నారు?</H>
        <ToggleButtonGroup exclusive fullWidth value={p.mode} onChange={(_, v: Mode | null) => v && set((x) => ({ ...x, mode: v }))} aria-label="రకం">
          <ToggleButton value="doc" sx={{ minHeight: 60, textTransform: "none", fontWeight: 800, fontSize: "1.05rem", flexDirection: "column" }}>
            📄 పత్రం / పోస్టర్
            <Typography component="span" variant="body2">
              PDF · Word · చిత్రం
            </Typography>
          </ToggleButton>
          <ToggleButton value="slides" sx={{ minHeight: 60, textTransform: "none", fontWeight: 800, fontSize: "1.05rem", flexDirection: "column" }}>
            🎞️ స్లైడ్ షో
            <Typography component="span" variant="body2">
              PowerPoint · సంగీతం
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box>
        <H>పరిమాణం</H>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }} role="radiogroup" aria-label="పరిమాణం">
          {sizes.map((k) => {
            const s = SIZES[k];
            const active = p[sizeKey] === k;
            const ratio = s.w / s.h;
            return (
              <Box
                key={k}
                component="button"
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set((x) => ({ ...x, [sizeKey]: k }))}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  p: 1.25,
                  minHeight: 64,
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left",
                  color: "var(--foreground)",
                  borderRadius: "12px",
                  bgcolor: active ? "var(--surface)" : "var(--surface-elevated)",
                  border: active ? "3px solid var(--secondary)" : "1px solid var(--border-strong)",
                  "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 },
                }}
              >
                <Box aria-hidden sx={{ width: ratio >= 1 ? 34 : 34 * ratio, height: ratio >= 1 ? 34 / ratio : 34, border: "2px solid var(--secondary)", borderRadius: "3px", flexShrink: 0, mx: ratio < 1 ? `${(34 - 34 * ratio) / 2}px` : 0 }} />
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{s.label}</Typography>
                  <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
                    {s.hint}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box>
        <H>రూపం (theme) — {THEMES.length}</H>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.25 }} role="radiogroup" aria-label="రూపం">
          {THEMES.map((t) => {
            const active = p.theme === t.id;
            return (
              <Box
                key={t.id}
                component="button"
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={t.name}
                onClick={() => set((x) => ({ ...x, theme: t.id }))}
                sx={{
                  p: 0.75,
                  cursor: "pointer",
                  font: "inherit",
                  color: "var(--foreground)",
                  borderRadius: "12px",
                  bgcolor: active ? "var(--surface)" : "var(--surface-elevated)",
                  border: active ? "3px solid var(--secondary)" : "1px solid var(--border-strong)",
                  "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 },
                }}
              >
                <ThemeThumb themeId={t.id} p={p} tick={tick} />
                <Typography sx={{ fontWeight: active ? 800 : 600, mt: 0.5, fontSize: "0.98rem" }}>
                  {active ? "✓ " : ""}
                  {t.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box>
        <H>ఫాంట్ (మొత్తం {p.mode === "doc" ? "పత్రానికి" : "స్లైడ్లకు"})</H>
        <FontPicker value={p.font} onChange={(v) => set((x) => ({ ...x, font: v ?? "" }))} label="పత్రం ఫాంట్" />
        <Typography variant="body2" sx={{ mt: 0.75, color: "var(--muted-text)" }}>
          ఒక్క శీర్షికకే వేరే ఫాంట్ కావాలంటే — ఆ పెట్టెను నొక్కి అక్కడి ఫాంట్ మార్చండి.
        </Typography>
      </Box>

      <Box>
        <H>పేజీ అమరిక</H>
        <Stack spacing={0.5}>
          {p.mode === "doc" && (
            <>
              <FormControlLabel control={<Switch checked={p.fit} onChange={(e) => set((x) => ({ ...x, fit: e.target.checked }))} />} label="అంతా ఒకే పేజీలో సరిపెట్టు (పోస్టర్)" />
              <FormControlLabel
                control={<Switch checked={p.vAlign === "middle"} onChange={(e) => set((x) => ({ ...x, vAlign: e.target.checked ? "middle" : "top" }))} />}
                label="పేజీ మధ్యలో (పై-కింద)"
              />
            </>
          )}
          <FormControlLabel control={<Switch checked={p.pageNumbers} onChange={(e) => set((x) => ({ ...x, pageNumbers: e.target.checked }))} />} label={p.mode === "doc" ? "పేజీ సంఖ్యలు" : "స్లైడ్ సంఖ్యలు"} />
          <TextField label="అడుగున వాక్యం (ఐచ్ఛికం) — ఉదా: రచన: మీ పేరు" value={p.footer} onChange={(e) => set((x) => ({ ...x, footer: e.target.value }))} fullWidth sx={{ mt: 1 }} />
        </Stack>
      </Box>

      <Box>
        <H>నేపథ్య చిత్రం</H>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          {p.bg?.src && <Box component="img" src={p.bg.src} alt="నేపథ్య చిత్రం" sx={{ width: 96, height: 64, objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-strong)" }} />}
          <PictureButton variant="outlined" label={p.bg ? "మార్చండి" : "చిత్రం ఎంచుకోండి"} onError={onError} onPicked={(pic) => set((x) => ({ ...x, bg: { ...pic, dim: x.bg?.dim ?? 0.55 } }))} />
          {p.bg && (
            <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => set((x) => ({ ...x, bg: null }))} sx={{ minHeight: 48, textTransform: "none", fontWeight: 700 }}>
              తీసివేయండి
            </Button>
          )}
        </Stack>
        {p.bg && (
          <Box sx={{ mt: 1.5 }}>
            <Typography id="dim-label" sx={{ fontWeight: 700 }}>
              చిత్రం మసక (అక్షరాలు కనిపించడానికి): {Math.round(p.bg.dim * 100)}%
            </Typography>
            <Slider aria-labelledby="dim-label" min={0} max={0.9} step={0.05} value={p.bg.dim} onChange={(_, v) => set((x) => ({ ...x, bg: x.bg ? { ...x.bg, dim: v as number } : null }))} />
          </Box>
        )}
      </Box>

      {p.mode === "slides" && (
        <Box>
          <H>స్లైడ్ షో</H>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography sx={{ fontWeight: 700 }}>ప్రతి స్లైడ్:</Typography>
              <Select value={p.show.seconds} onChange={(e) => set((x) => ({ ...x, show: { ...x.show, seconds: Number(e.target.value) } }))} inputProps={{ "aria-label": "ప్రతి స్లైడ్ సమయం" }} sx={{ minHeight: 48 }}>
                {[0, 3, 5, 6, 8, 10, 15, 20, 30].map((s) => (
                  <MenuItem key={s} value={s} sx={{ minHeight: 44 }}>
                    {s === 0 ? "నేను నొక్కినప్పుడే మారాలి" : `${s} సెకన్లు`}
                  </MenuItem>
                ))}
              </Select>
              <Select value={p.show.transition} onChange={(e) => set((x) => ({ ...x, show: { ...x.show, transition: e.target.value as Project["show"]["transition"] } }))} inputProps={{ "aria-label": "మార్పు ప్రభావం" }} sx={{ minHeight: 48 }}>
                <MenuItem value="fade" sx={{ minHeight: 44 }}>మెల్లగా కనిపించడం</MenuItem>
                <MenuItem value="slide" sx={{ minHeight: 44 }}>పక్కకు జారడం</MenuItem>
                <MenuItem value="zoom" sx={{ minHeight: 44 }}>దగ్గరికి రావడం</MenuItem>
                <MenuItem value="none" sx={{ minHeight: 44 }}>ఏమీ వద్దు</MenuItem>
              </Select>
            </Stack>
            <FormControlLabel control={<Switch checked={p.show.loop} onChange={(e) => set((x) => ({ ...x, show: { ...x.show, loop: e.target.checked } }))} />} label="చివరి స్లైడ్ తర్వాత మళ్ళీ మొదటి నుంచి" />

            <Box sx={{ p: 1.5, borderRadius: "12px", border: "1px solid var(--border-strong)", bgcolor: "var(--surface-elevated)" }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>🎵 నేపథ్య సంగీతం</Typography>
              {music ? (
                <Stack spacing={1}>
                  <Typography sx={{ wordBreak: "break-word" }}>{music.name}</Typography>
                  {musicUrl && <Box component="audio" controls src={musicUrl} sx={{ width: "100%" }} aria-label="సంగీతం వినండి" />}
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => musicRef.current?.click()} sx={{ minHeight: 48, textTransform: "none", fontWeight: 700 }}>
                      మార్చండి
                    </Button>
                    <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => onMusic(null)} sx={{ minHeight: 48, textTransform: "none", fontWeight: 700 }}>
                      తీసివేయండి
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Button variant="contained" startIcon={<MusicNoteRoundedIcon />} onClick={() => musicRef.current?.click()} sx={{ minHeight: 52, textTransform: "none", fontWeight: 800, bgcolor: "var(--secondary)" }}>
                  పాట / సంగీతం ఎంచుకోండి (MP3)
                </Button>
              )}
              <Typography variant="body2" sx={{ mt: 1, color: "var(--muted-text)" }}>
                సంగీతం ఈ పరికరంలోనే ఉంటుంది, ఎక్కడికీ పంపము. గరిష్ఠం 30 MB.
              </Typography>
              <input
                ref={musicRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (!f.type.startsWith("audio/")) return onError("ఇది పాట ఫైల్ కాదు. MP3 / M4A ఫైల్ ఎంచుకోండి.");
                  if (f.size > MAX_MUSIC) return onError("పాట ఫైల్ చాలా పెద్దది (గరిష్ఠం 30 MB).");
                  onMusic({ name: f.name, blob: f });
                }}
              />
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
