"use client"; // This component runs on the client side

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material'; // Removed Select, MenuItem, FormControl, InputLabel

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // The single default music track
  const defaultMusicTrack = 'Default.mp3';
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Effect to set the audio source once when the component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = `/MusicPlayer/${defaultMusicTrack}`;
      // Optional: Autoplay the music when the component mounts
      // audioRef.current.play().catch(e => console.error("Error playing audio on mount:", e));
      // setIsPlaying(true); // Uncomment if you want autoplay
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
    <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, textAlign: 'center' }}>
      <Typography variant="h5" component="h3" gutterBottom>
        నేపథ్య సంగీతం (Background Music)
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={toggleMusic} 
          sx={{ 
            bgcolor: isPlaying ? 'error.main' : 'success.main', 
            '&:hover': { 
              bgcolor: isPlaying ? 'error.dark' : 'success.dark' 
            } 
          }}
        >
          {isPlaying ? '⏹ సంగీతం ఆపండి' : '▶ సంగీతం ప్లే చేయండి'}
        </Button>
      </Box>
      <audio id="bg-music" loop ref={audioRef}></audio>
    </Box>
  );
}
