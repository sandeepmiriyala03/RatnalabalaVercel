"use client";

import { useState } from "react";
import {
  Fab,
  Tooltip,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ChatbotWindow from "./ChatbotWindow";

export default function FloatingAIButton() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      {/* Floating AI Button */}
      <Tooltip
        title={isMobile ? "" : "భావాలమాల – AI సహాయకుడు"}
        placement="left"
        arrow
      >
        <Box
          sx={{
            position: "fixed",
            bottom: isMobile ? 96 : 24, // ⬆️ above bottom nav
            left: 16,
            zIndex: 1600,
          }}
        >
          <Fab
            color="secondary"
            onClick={() => setOpen(true)}
            variant={isMobile ? "extended" : "circular"}
            sx={{
              px: isMobile ? 2 : 0,
              height: isMobile ? 48 : 56,
              borderRadius: isMobile ? 999 : "50%",
              boxShadow: 6,
            }}
            aria-label="AI సహాయకుడు"
          >
            <SmartToyIcon />
            {isMobile && (
              <Typography
                sx={{
                  ml: 1,
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                AI
              </Typography>
            )}
          </Fab>
        </Box>
      </Tooltip>

      {/* Chat Window */}
      <ChatbotWindow open={open} onClose={() => setOpen(false)} />
    </>
  );
}


