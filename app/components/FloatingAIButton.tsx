"use client";

import { useState } from "react";
import { Fab, Tooltip } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ChatbotWindow from "./ChatbotWindow";

export default function FloatingAIButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="భావాలమాల – AI సహాయకుడు" placement="left">
        <Fab
          color="secondary"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: { xs: 90, md: 24 },
            right: 20,
            zIndex: 1600,
          }}
        >
          <SmartToyIcon />
        </Fab>
      </Tooltip>

      <ChatbotWindow open={open} onClose={() => setOpen(false)} />
    </>
  );
}
