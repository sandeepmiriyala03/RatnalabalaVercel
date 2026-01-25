"use client";

import React, { useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

import ShareButtons from "@/app/components/ShareBar";
import type { Sameta } from "@/app/types/sametalu";

type Props = {
  sameta: Sameta;
};

const SametaPosterCard: React.FC<Props> = ({ sameta }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        background: "linear-gradient(135deg,#fffaf0,#fff)",
      }}
    >
      <CardContent>
        {/* 🖼 Poster root */}
        <Box
          ref={ref}
          data-poster-root
          sx={{
            px: 3,
            py: 4,
            textAlign: "center",
          }}
        >
          {/* 🔰 Heading */}
          <Typography
            sx={{
              fontSize: "1.2rem",
              fontWeight: 900,
              mb: 2,
              letterSpacing: "0.5px",
            }}
          >
            తెలుగు సామెతలు
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 📜 Sameta text (max 3 lines) */}
          <Typography
            sx={{
              fontSize: "1.05rem",
              lineHeight: 1.9,
              fontWeight: 500,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {sameta.text}
          </Typography>

          {/* 🧾 Footer */}
          <Divider sx={{ my: 2 }} />

              <Typography
        sx={{
          fontSize: "0.8rem",
          opacity: 0.8,
          fontWeight: 600,
          letterSpacing: "0.3px",
        }}
      >
        📖 చదవచ్చు | 🎧 వినచ్చు | 📤 పంచుకోవచ్చు
      </Typography>
        </Box>

        {/* 📤 Share only */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <ShareButtons targetRef={ref} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SametaPosterCard;
