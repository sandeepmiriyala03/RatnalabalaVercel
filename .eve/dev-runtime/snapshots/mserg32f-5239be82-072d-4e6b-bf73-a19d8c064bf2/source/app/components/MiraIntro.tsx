"use client";

import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { useRouter } from "next/navigation";

export default function MiraIntro() {
  const router = useRouter();

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", my: { xs: 3, md: 5 } }}>
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            align="center"
            fontWeight={700}
            gutterBottom
          >
            🖋️ డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు
          </Typography>

          <Typography
            align="center"
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.8,
              opacity: 0.9,
            }}
          >
            ప్రముఖ తెలుగు రచయిత, పరిశోధకుడు. <br />
            సుమారు <b>36 సంవత్సరాలు</b> తెలుగు భాషా–సాహిత్యాన్ని
            బోధించిన ఉపాధ్యాయుడు. <br />
            మహాకవి <b>శ్రీశ్రీ</b> కవిత్వంపై పరిశోధన చేసిన పండితుడు. <br />
            కథలు, పద్యాలు, బాలసాహిత్యం ద్వారా <br />
            తెలుగు సాహిత్యానికి విశేష సేవలందించారు.
          </Typography>

          {/* 🔘 CTA BUTTONS */}
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
            >
              📜 డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారి ప్రస్థానం
            </Button>

            <Button
              variant="contained"
              size="medium"
              onClick={() => router.push("/mirapoems")}
            >
              📖 పద్యాలు చదవండి
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
