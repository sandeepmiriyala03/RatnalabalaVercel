"use client";

/* ═══════════════════════════════════════════════════════════════
   మా కవులు — 2. డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు (మిరా)
   RatnalabalaBackground తో ఒకే రూపం — page.tsx లో పక్కపక్కనే
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const ACCENT = "var(--secondary)";

export default function MiraIntro() {
  return (
    <Box
      component="article"
      aria-labelledby="poet-mira"
      sx={{
        height: "100%",
                    boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: "var(--radius)",
        bgcolor: "var(--surface-elevated)",
        border: "1.5px solid var(--border-strong)",
        borderTop: `5px solid ${ACCENT}`,
        boxShadow: "0 6px 24px color-mix(in srgb, var(--foreground) 10%, transparent)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box
          aria-hidden
          sx={{ width: 68, height: 68, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: ACCENT, color: "var(--background)", fontWeight: 800, fontSize: "1.6rem", border: "3px solid var(--accent-light)" }}
        >
          మిరా
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography id="poet-mira" component="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.3rem", sm: "1.45rem" }, lineHeight: 1.4 }}>
            డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు
          </Typography>
          <Typography sx={{ fontSize: "1.02rem", color: "var(--muted-text)" }}>రచయిత · పరిశోధకుడు · ఉపాధ్యాయుడు</Typography>
        </Box>
      </Stack>

      <Box component="blockquote" sx={{ m: 0, mb: 2, pl: 2, borderLeft: "4px solid var(--accent-light)" }}>
        <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.7 }}>36 ఏళ్ళు తెలుగు నేర్పిన గురువు</Typography>
        <Typography sx={{ fontSize: "1rem", color: "var(--muted-text)" }}>మహాకవి శ్రీశ్రీ కవిత్వంపై పరిశోధన</Typography>
      </Box>

      <Typography sx={{ fontSize: "1.08rem", lineHeight: 1.9, mb: 2 }}>
        ప్రముఖ తెలుగు రచయిత, పండితుడు. కథలు, పద్యాలు, బాలసాహిత్యం ద్వారా తెలుగు సాహిత్యానికి విశేష సేవలందించారు.
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
        {["శ్రీశ్రీ పరిశోధన", "కథలు, పద్యాలు", "బాలసాహిత్యం"].map((t) => (
          <Chip key={t} label={t} sx={{ fontSize: "0.98rem", fontWeight: 700, height: 36, bgcolor: "var(--surface)", border: "1px solid var(--border-strong)" }} />
        ))}
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <Button
          component={Link}
          href="/mirapoems"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            minHeight: 52,
            px: 2.75,
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            bgcolor: ACCENT,
            color: "var(--background)",
            "&:hover": { bgcolor: ACCENT, filter: "brightness(1.1)" },
            "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: "3px" },
          }}
        >
          📖 పద్యాలు చదవండి
        </Button>
        <Button
          component={Link}
          href="/mira"
          sx={{
            minHeight: 52,
            px: 2.5,
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            color: ACCENT,
            border: `1.5px solid ${ACCENT}`,
            "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: "3px" },
          }}
        >
          📜 వారి ప్రస్థానం
        </Button>
      </Stack>
    </Box>
  );
}