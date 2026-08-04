"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Collapse,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice from "@/app/components/TeluguVoice";
import type { KathamalaStory } from "@/app/types/kathamala";

type Props = {
  story: KathamalaStory;
  enableRead?: boolean;
  seriesName?: string;
};

const StoryCard: React.FC<Props> = ({
  story,
  enableRead = true,
  seriesName = "కథామాల",
}) => {
  const storyRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const voiceText = `${story.title}. ${story.story_text.join(" ")}. సందేశం: ${story.moral}`;

  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(voiceText);
    utterance.lang = "te-IN";
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <CardContent>
        {/* Story */}
        <Box
          ref={storyRef}
          data-poster-root
          sx={{
            px: { xs: 2, sm: 4 },
            py: { xs: 2.5, sm: 4 },
          }}
        >
          {/* Title */}
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "1.15rem", sm: "1.35rem" },
              mb: 2,
            }}
          >
            {story.title}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* Story Text */}
          <Box sx={{ textAlign: "center" }}>
            {story.story_text.map((line, idx) => (
              <Typography
                key={idx}
                sx={{
                  lineHeight: 1.9,
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  mb: 0.5,
                }}
              >
                {line}
              </Typography>
            ))}
          </Box>

          {/* Moral */}
          <Typography
            sx={{
              mt: 3,
              textAlign: "center",
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              color: "success.main",
            }}
          >
            🌼 సందేశం: {story.moral}
          </Typography>

          {/* Footer */}
          {seriesName && (
            <Box
              sx={{
                mt: 3,
                pt: 1.5,
                borderTop: "1px solid #eee",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                {seriesName}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Controls */}
        <Box
          sx={{
            mt: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {enableRead && (
            <Box>
              <IconButton onClick={speak}>
                <VolumeUpIcon color="primary" />
              </IconButton>

              <IconButton onClick={stop}>
                <StopCircleIcon color="error" />
              </IconButton>
            </Box>
          )}

          <ShareButtons targetRef={storyRef} />
        </Box>

        {/* AI Tools */}
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setVoiceOpen((v) => !v)}
          startIcon={<AutoAwesomeRoundedIcon />}
          endIcon={
            voiceOpen ? (
              <ExpandLessRoundedIcon />
            ) : (
              <ExpandMoreRoundedIcon />
            )
          }
          sx={{
            mt: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: alpha(theme.palette.secondary.main, 0.4),
            color: "secondary.main",
          }}
        >
          ✨ AI సాధనలు
        </Button>

        {/* AI Panel */}
        <Collapse in={voiceOpen}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              background: alpha(theme.palette.background.default, 0.6),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "secondary.main",
                mb: 1,
              }}
            >
              ధ్వని · కళ · వీడియో
            </Typography>

            <TeluguVoice initialText={voiceText} />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default StoryCard;