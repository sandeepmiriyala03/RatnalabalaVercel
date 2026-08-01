"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Chip,
  Divider,
  Paper,
  InputLabel,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

import SametaluList from "@/app/components/SametaluList";
import PythonSametaluChat from "@/app/components/PythonSametaluChat";
import {
  SAMETALU_GROUPS,
  TeluguLetter,
} from "@/app/types/sametalu";

export default function SametaluPage() {
  const [letter, setLetter] = useState<TeluguLetter>("అ");

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      {/* 🌼 Title */}
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
        }}
      >
        సామెతల మాల
      </Typography>

      <Typography align="center" sx={{ opacity: 0.8, mb: 3 }}>
        అక్షరాల వారీగా తెలుగు సామెతలు
      </Typography>

      {/* 🧠 Info */}
      <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
        <Chip label="📚 తెలుగు సామెతలు" variant="outlined" />
        <Chip label="🔤 అక్షర క్రమం" variant="outlined" />
      </Stack>

      {/* 🤖 MOVED TO TOP — the agent is now the first thing visible
          after the title, ahead of the letter browser, making it the
          primary way to interact with this page rather than a
          secondary extra at the bottom. */}
      <Paper sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", mb: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <ChatBubbleOutlineRoundedIcon color="primary" fontSize="small" />
          <Typography fontWeight={700}>ఏదైనా సామెత గురించి అడగండి</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          ఉదా: &ldquo;కోతికి కొబ్బరికాయ దొరికినట్టు అంటే ఏమిటి?&rdquo; అని అడగండి.
        </Typography>
        <PythonSametaluChat />
      </Paper>

      <Divider sx={{ my: 4 }}>లేదా అక్షరాల వారీగా చూడండి</Divider>

      {/* 🎛 Dropdown */}
      <FormControl size="small" sx={{ minWidth: 200, mx: "auto", display: "block" }}>
        <InputLabel id="letter-select-label">అక్షర క్రమం</InputLabel>
        <Select
          labelId="letter-select-label"
          label="అక్షర క్రమం"
          value={letter}
          onChange={(e) => setLetter(e.target.value as TeluguLetter)}
        >
          {SAMETALU_GROUPS.map((g) => (
            <MenuItem key={g.key} value={g.key}>
              {g.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* 📜 List */}
      <SametaluList letter={letter} />
    </Box>
  );
}