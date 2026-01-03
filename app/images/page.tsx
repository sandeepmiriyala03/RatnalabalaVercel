import { Box, Typography } from "@mui/material";

interface MediaItem {
  name: string;
  audio?: string;
  video?: string;
}

export default async function ImagesPage() {
  let mediaItems: MediaItem[] = [];
  let errorMessage: string | null = null;

  try {
    const apiUrl = `/api/media`; // ✅ Fix: Relative URL for static generation
    console.log(`Fetching from: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      // ✅ Fix: Allow caching + revalidation for static generation
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`HTTP ${res.status}:`, errorText);
      
      errorMessage = `Media API error (${res.status})`;
      throw new Error(errorText);
    }

    const data = await res.json();
    
    if (!data?.mediaItems?.length) {
      errorMessage = "No media items found";
      throw new Error("Empty mediaItems");
    }

    mediaItems = data.mediaItems as MediaItem[];
    console.log(`Loaded ${mediaItems.length} items`);

  } catch (error) {
    console.error("ImagesPage error:", error);
    if (!errorMessage) {
      errorMessage = "Failed to load media gallery";
    }
  }

  if (errorMessage) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Media Loading Error
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {errorMessage}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Check `/api/media` endpoint
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        🎵 ధ్వని దృశ్యం Gallery
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
          p: { xs: 1, md: 2 },
        }}
      >
        {mediaItems.map((item) => (
          <Box
            key={item.name}
            sx={{
              border: "2px solid",
              borderColor: "grey.200",
              borderRadius: 3,
              p: 3,
              bgcolor: "background.paper",
              boxShadow: 1,
              transition: "all 0.2s",
              "&:hover": { boxShadow: 3, transform: "translateY(-4px)" },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
            >
              {item.name}
            </Typography>

            {item.audio && (
              <Box sx={{ flex: 1, width: "100%", mb: 1 }}>
                <audio 
                  controls 
                  style={{ width: "100%" }}
                  preload="metadata"
                >
                  <source src={item.audio} type="audio/mpeg" />
                  Audio not supported
                </audio>
              </Box>
            )}

            {item.video && (
              <Box sx={{ flex: 1, width: "100%" }}>
                <video
                  controls
                  width="100%"
                  height="auto"
                  style={{ borderRadius: 2 }}
                  preload="metadata"
                >
                  <source src={item.video} type="video/mp4" />
                  Video not supported
                </video>
              </Box>
            )}

            {(!item.audio && !item.video) && (
              <Typography variant="body2" color="text.secondary">
                No media available
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
