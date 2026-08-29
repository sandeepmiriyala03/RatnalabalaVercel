"use client"; // This component runs on the client side

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // The single default music track
  const defaultMusicTrack = 'Style1.mp3';
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Effect to set the audio source once when the component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = `/MusicPlayer/${defaultMusicTrack}`;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Toggles music playback (Play/Pause/Stop).
   */
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        // If currently playing, stop the music
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reset to start
        setIsPlaying(false);
      } else {
        // If not playing, start the music
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        setIsPlaying(true);
      }
    }
  };

  return (
    <Box
      sx={{
        mt: 6,
        p: 3,
        bgcolor: 'var(--surface-elevated)',
        border: '1.5px solid var(--border-strong)',
        borderRadius: 'var(--radius)',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h5"
        component="h3"
        gutterBottom
        sx={{ color: 'var(--foreground)', fontFamily: "'Noto Serif Telugu', serif" }}
      >
        నేపథ్య సంగీతం
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          onClick={toggleMusic}
          sx={{
            // Forest green while playing (a positive/active state, same
            // role "success" played before) and maroon once stopped —
            // both from the shared brand tokens instead of MUI's
            // generic green/red defaults.
            bgcolor: isPlaying ? 'var(--secondary)' : 'var(--primary)',
            color: 'var(--background)',
            fontWeight: 700,
            borderRadius: '999px',
            px: 3,
            '&:hover': {
              filter: 'brightness(1.1)',
              bgcolor: isPlaying ? 'var(--secondary)' : 'var(--primary)',
            },
            '&:focus-visible': {
              outline: '3px solid var(--primary)',
              outlineOffset: '4px',
            },
          }}
        >
          {isPlaying ? '⏹ సంగీతం ఆపండి' : '▶ సంగీతం ప్లే చేయండి'}
        </Button>
      </Box>
      <audio id="bg-music" loop ref={audioRef}></audio>
    </Box>
  );
}