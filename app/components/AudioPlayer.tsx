"use client";

import { useRef, useState } from "react";
import { IconButton } from "@mui/material";
import { VolumeUp as VolumeUpIcon } from "@/lib/yuktai-icons";
import { Pause as PauseIcon } from "@/lib/yuktai-icons";

type AudioPlayerProps = {
  src: string;
};

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setPlaying(!playing);
  };

  return (
    <>
      <IconButton onClick={toggleAudio} color="inherit">
        {playing ? <PauseIcon /> : <VolumeUpIcon />}
      </IconButton>

      <audio ref={audioRef} src={src} />
    </>
  );
}
