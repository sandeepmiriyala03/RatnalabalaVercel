"use client";

import { useEffect, useState } from "react";
import { Grid, Typography, Box, Dialog } from "@mui/material";
import Image from "next/image";

interface MediaItem {
  name: string;
  image: string | null;
  audio: string | null;
  video: string | null;
}

export default function ImagesPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        setMediaItems(data.mediaItems);
      });
  }, []);

  const handleOpen = (media: MediaItem) => {
    setSelectedMedia(media);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMedia(null);
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        Ratnalabala Media Gallery
      </Typography>

      <Grid container spacing={3}>
        {mediaItems.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file.name}>
            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => handleOpen(file)}
            >
              {file.image && (
                <Image
                  src={file.image}
                  alt={file.name}
                  width={300}
                  height={200}
                  style={{ borderRadius: "8px" }}
                />
              )}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                {file.name}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* POPUP DIALOG */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          {selectedMedia?.image && (
            <Image
              src={selectedMedia.image}
              alt={selectedMedia.name}
              width={600}
              height={400}
              style={{ borderRadius: "8px", maxWidth: "100%" }}
            />
          )}

          {selectedMedia?.audio && (
            <Box sx={{ mt: 3 }}>
              <audio controls style={{ width: "100%" }}>
                <source src={selectedMedia.audio} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}

          {selectedMedia?.video && (
            <Box sx={{ mt: 3 }}>
              <video
                src={selectedMedia.video}
                controls
                width="600"
                style={{ borderRadius: "8px", maxWidth: "100%" }}
              />
            </Box>
          )}

          <Typography variant="h6" sx={{ mt: 3 }}>
            {selectedMedia?.name}
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
}
