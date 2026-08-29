"use client";

import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { useRouter } from "next/navigation";

export default function MiraIntro() {
  const router = useRouter();

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", my: { xs: 3, md: 5 } }}>
      <Card
        sx={{
          bgcolor: "var(--surface-elevated)",
          border: "1.5px solid var(--border-strong)",
          borderRadius: "var(--radius)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            align="center"
            fontWeight={700}
            gutterBottom
            sx={{ color: "var(--foreground)", fontFamily: "'Noto Serif Telugu', serif" }}
          >
            🖋️ డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు
          </Typography>

          <Typography
            align="center"
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.8,
              color: "var(--muted-text)",
            }}
          >
            ప్రముఖ తెలుగు రచయిత, పరిశోధకుడు. <br />
            సుమారు <b>36 సంవత్సరాలు</b> తెలుగు భాషా–సాహిత్యాన్ని
            బోధించిన ఉపాధ్యాయుడు. <br />
            మహాకవి <b>శ్రీశ్రీ</b> కవిత్వంపై పరిశోధన చేసిన పండితుడు. <br />
            కథలు, పద్యాలు, బాలసాహిత్యం ద్వారా <br />
            తెలుగు సాహిత్యానికి విశేష సేవలందించారు.
          </Typography>

          {/* 🔘 CTA BUTTONS — both explicitly styled with brand tokens.
              Left as plain variant="outlined"/"contained" these render
              MUI's own default theme blue (see the theme.ts note below
              the component — this keeps happening because there's no
              custom MUI theme yet). */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="center"
            spacing={2}
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              size="medium"
              onClick={() => router.push("/mira")}
              sx={{
                color: "var(--primary)",
                borderColor: "var(--primary)",
                borderWidth: "1.5px",
                fontWeight: 700,
                borderRadius: "999px",
                "&:hover": { borderColor: "var(--primary)", bgcolor: "var(--surface)" },
                "&:focus-visible": { outline: "3px solid var(--primary)", outlineOffset: "4px" },
              }}
            >
              📜 డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారి ప్రస్థానం
            </Button>

            <Button
              variant="contained"
              size="medium"
              onClick={() => router.push("/mirapoems")}
              sx={{
                bgcolor: "var(--primary)",
                color: "var(--background)",
                fontWeight: 700,
                borderRadius: "999px",
                "&:hover": { filter: "brightness(1.1)", bgcolor: "var(--primary)" },
                "&:focus-visible": { outline: "3px solid var(--primary)", outlineOffset: "4px" },
              }}
            >
              📖 పద్యాలు చదవండి
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}