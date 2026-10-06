"use client";

/* ═══════════════════════════════════════════════════════════════
   నా ఫాంట్లు — పాఠకుడు తన సొంత తెలుగు ఫాంట్‌ను ఈ సైట్‌లో వాడుకోవడం

   • ఫాంట్ ఫైల్ అప్‌లోడ్: ఫోన్, ట్యాబ్, కంప్యూటర్ — ఏ పరికరంలోనైనా
   • కంప్యూటర్‌లోని ఫాంట్లు: Chrome / Edge డెస్క్‌టాప్‌లో మాత్రమే
     (ఆ బ్రౌజర్లలోనే ఈ సౌకర్యం ఉంది; మిగతా చోట్ల బటన్ కనిపించదు)

   ఫాంట్లు ఈ పరికరంలోనే సేవ్ అవుతాయి. సర్వర్‌కి ఏదీ పంపము.
   ═══════════════════════════════════════════════════════════════ */

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import {
  addDeviceFont,
  addFontFile,
  fontStack,
  listDeviceFonts,
  loadTeluguFont,
  removeUserFont,
  supportsDeviceFonts,
  useTeluguFonts,
} from "@/lib/teluguFonts";

const SAMPLE = "తెలుగు భాష తియ్యనిది";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the font name when the reader chooses to use a font */
  onPick: (value: string) => void;
  /** The font currently in use, to mark it */
  current?: string;
};

type Note = { type: "success" | "warning" | "error" | "info"; text: string } | null;

export default function MyFontsDialog({ open, onClose, onPick, current }: Props) {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const fileRef = useRef<HTMLInputElement>(null);
  const { fonts } = useTeluguFonts();
  const myFonts = fonts.filter((f) => f.kind === "upload" || f.kind === "device");

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [deviceList, setDeviceList] = useState<{ telugu: string[]; others: string[] } | null>(null);
  const [showAllDevice, setShowAllDevice] = useState(false);
  const canUseDevice = supportsDeviceFonts();

  const use = (value: string) => {
    void loadTeluguFont(value);
    onPick(value);
  };

  /* ---------- 1. upload ---------- */
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setNote(null);
    let last: string | null = null;
    const problems: string[] = [];
    let noTelugu = 0;

    for (const file of Array.from(files)) {
      const r = await addFontFile(file);
      if (r.ok) {
        last = r.font.value;
        if (!r.hasTelugu) noTelugu++;
      } else {
        problems.push(`${file.name}: ${r.error}`);
      }
    }

    setBusy(false);
    if (fileRef.current) fileRef.current.value = ""; // same file can be picked again
    if (last) use(last); // the newest font is applied straight away

    if (problems.length) setNote({ type: "error", text: problems.join("\n") });
    else if (noTelugu)
      setNote({
        type: "warning",
        text: "ఫాంట్ జోడించాం, కానీ ఇందులో తెలుగు అక్షరాలు లేనట్టున్నాయి. తెలుగు పదాలు ఫోన్ ఫాంట్‌లో కనిపిస్తాయి.",
      });
    else if (last) setNote({ type: "success", text: "మీ ఫాంట్ జోడించి, సైట్ అంతటా వర్తింపజేశాం ✓" });
  };

  /* ---------- 2. computer fonts ---------- */
  const openDeviceFonts = async () => {
    setBusy(true);
    setNote(null);
    const r = await listDeviceFonts();
    setBusy(false);
    if (!r.ok) {
      setNote({ type: "error", text: r.error });
      return;
    }
    setDeviceList({ telugu: r.telugu, others: r.others });
    setShowAllDevice(r.telugu.length === 0);
    if (r.telugu.length === 0)
      setNote({ type: "info", text: "మీ కంప్యూటర్‌లో తెలుగు ఫాంట్లు కనిపించలేదు. కింద అన్ని ఫాంట్లు చూపిస్తున్నాం." });
  };

  const addDevice = async (family: string) => {
    await addDeviceFont(family);
    use(family);
    setNote({ type: "success", text: `"${family}" ను నా ఫాంట్లలో చేర్చి వర్తింపజేశాం ✓` });
  };

  const deviceShown = deviceList ? (showAllDevice ? [...deviceList.telugu, ...deviceList.others] : deviceList.telugu) : [];
  const alreadyAdded = new Set(myFonts.filter((f) => f.kind === "device").map((f) => f.value));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="my-fonts-title"
      PaperProps={{
        sx: {
          bgcolor: "var(--background)",
          color: "var(--foreground)",
          borderRadius: fullScreen ? 0 : "var(--radius)",
          pt: fullScreen ? "env(safe-area-inset-top, 0px)" : 0,
          pb: fullScreen ? "env(safe-area-inset-bottom, 0px)" : 0,
        },
      }}
    >
      <DialogTitle
        id="my-fonts-title"
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, fontWeight: 800, fontSize: "1.25rem" }}
      >
        నా ఫాంట్లు
        <IconButton onClick={onClose} aria-label="మూసివేయండి" sx={{ color: "var(--foreground)" }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "var(--border)" }}>
        <Typography sx={{ lineHeight: 1.8, mb: 2 }}>
          మీ దగ్గర ఉన్న తెలుగు ఫాంట్‌ను ఈ సైట్‌లో వాడుకోండి. ఫాంట్ <strong>మీ పరికరంలోనే</strong> ఉంటుంది;
          మేము ఎక్కడికీ పంపము, సేవ్ చేయము.
        </Typography>

        {/* ---- Add ---- */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            startIcon={<UploadFileRoundedIcon />}
            sx={{
              flex: 1,
              minHeight: 56,
              fontSize: "1rem",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "var(--radius-sm)",
              bgcolor: "var(--secondary)",
              color: "var(--background)",
              "&:hover": { bgcolor: "var(--secondary)", filter: "brightness(1.08)" },
            }}
          >
            ఫాంట్ ఫైల్ ఎంచుకోండి
          </Button>

          {canUseDevice && (
            <Button
              onClick={openDeviceFonts}
              disabled={busy}
              startIcon={<ComputerRoundedIcon />}
              sx={{
                flex: 1,
                minHeight: 56,
                fontSize: "1rem",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--secondary)",
                color: "var(--secondary)",
              }}
            >
              కంప్యూటర్‌లోని ఫాంట్లు
            </Button>
          )}
        </Stack>

        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2,application/font-sfnt,application/x-font-ttf,application/x-font-otf"
          onChange={(e) => void onFiles(e.target.files)}
        />

        <Typography sx={{ fontSize: "0.9rem", color: "var(--muted-text)", mt: 1, lineHeight: 1.7 }}>
          .ttf, .otf, .woff, .woff2 ఫైళ్ళు (గరిష్ఠం 20 MB). ఫోన్‌లో &ldquo;Files&rdquo; / &ldquo;Downloads&rdquo; నుండి ఎంచుకోవచ్చు.
          మీకు వాడుకునే హక్కు ఉన్న ఫాంట్లు మాత్రమే జోడించండి.
        </Typography>

        {busy && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }} role="status">
            <CircularProgress size={20} />
            <Typography>పని జరుగుతోంది…</Typography>
          </Stack>
        )}

        {note && (
          <Alert severity={note.type} onClose={() => setNote(null)} sx={{ mt: 2, whiteSpace: "pre-line", fontSize: "0.95rem" }}>
            {note.text}
          </Alert>
        )}

        {/* ---- Computer fonts list ---- */}
        {deviceList && (
          <Box sx={{ mt: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography component="h3" sx={{ fontWeight: 700 }}>
                {showAllDevice ? "కంప్యూటర్‌లోని అన్ని ఫాంట్లు" : `తెలుగు ఫాంట్లు (${deviceList.telugu.length})`}
              </Typography>
              {deviceList.others.length > 0 && (
                <Button size="small" onClick={() => setShowAllDevice((v) => !v)} sx={{ textTransform: "none" }}>
                  {showAllDevice ? "తెలుగు ఫాంట్లు మాత్రమే" : `అన్నీ చూపించు (${deviceList.telugu.length + deviceList.others.length})`}
                </Button>
              )}
            </Stack>

            <Box sx={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              {deviceShown.map((family) => (
                <Stack
                  key={family}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ px: 1.5, py: 1, borderBottom: "1px solid var(--border)" }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{family}</Box>
                    <Box data-telugu-font="" sx={{ fontFamily: fontStack(family), fontSize: "1.15rem", lineHeight: 1.6 }}>
                      {SAMPLE}
                    </Box>
                  </Box>
                  {alreadyAdded.has(family) ? (
                    <Button size="small" onClick={() => use(family)} sx={{ textTransform: "none", flexShrink: 0 }}>
                      వాడండి
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => void addDevice(family)}
                      sx={{ textTransform: "none", flexShrink: 0 }}
                    >
                      జోడించు
                    </Button>
                  )}
                </Stack>
              ))}
            </Box>
          </Box>
        )}

        {/* ---- My fonts ---- */}
        <Divider sx={{ my: 2.5 }} />
        <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>
          జోడించిన ఫాంట్లు ({myFonts.length})
        </Typography>

        {myFonts.length === 0 ? (
          <Typography sx={{ color: "var(--muted-text)", lineHeight: 1.7 }}>
            ఇంకా ఏ ఫాంట్ జోడించలేదు. పైన బటన్ నొక్కి మీ ఫాంట్ జోడించండి.
          </Typography>
        ) : (
          <Stack component="ul" spacing={1} sx={{ listStyle: "none", p: 0, m: 0 }}>
            {myFonts.map((f) => {
              const inUse = f.value === current;
              return (
                <Box
                  component="li"
                  key={f.id}
                  sx={{
                    p: 1.5,
                    borderRadius: "var(--radius-sm)",
                    border: `1.5px solid ${inUse ? "var(--secondary)" : "var(--border-strong)"}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ fontWeight: 700, fontSize: "0.95rem", overflowWrap: "anywhere" }}>
                        {f.label}{" "}
                        <Box component="span" sx={{ fontWeight: 400, color: "var(--muted-text)", fontSize: "0.85rem" }}>
                          · {f.kind === "device" ? "కంప్యూటర్" : "అప్‌లోడ్"}
                        </Box>
                      </Box>
                      <Box data-telugu-font="" sx={{ fontFamily: fontStack(f.value), fontSize: "1.2rem", lineHeight: 1.6 }}>
                        {SAMPLE}
                      </Box>
                    </Box>

                    {inUse ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--secondary)", fontWeight: 700, flexShrink: 0 }}>
                        <CheckRoundedIcon fontSize="small" /> వాడుతున్నారు
                      </Box>
                    ) : (
                      <Button
                        onClick={() => use(f.value)}
                        sx={{ textTransform: "none", fontWeight: 700, flexShrink: 0 }}
                      >
                        వాడండి
                      </Button>
                    )}
                    <IconButton
                      onClick={() => void removeUserFont(f.id)}
                      aria-label={`${f.label} తీసేయండి`}
                      sx={{ color: "var(--error)", flexShrink: 0 }}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}