"use client";

import { Container, Typography } from "@mui/material";
import TeluguNewsReader from "@/app/components/TeluguNewsReader";

export default function NewsReaderPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={800} textAlign="center" sx={{ mb: 3 }}>
        తెలుగు న్యూస్ TTS రీడర్
      </Typography>

      {/* That's it — the component is fully self-contained:
          it manages its own text input, voice/speed controls,
          play/pause, visualizer, and MP3 download internally. */}
      <TeluguNewsReader />
    </Container>
  );
}