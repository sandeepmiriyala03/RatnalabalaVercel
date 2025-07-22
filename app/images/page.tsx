import { Box, Typography } from "@mui/material";

interface MediaItem {
  name: string;
  audio?: string;
  video?: string;
}

export default async function ImagesPage() {
  let mediaItems: MediaItem[] = [];
  let errorMessage: string | null = null; // To store error messages

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/media`;
    console.log(`Fetching from: ${apiUrl}`); // Debugging: log the actual URL

    const res = await fetch(apiUrl, {
      cache: "no-store", // Ensures fresh data on each request
    });

    // IMPORTANT: Check if the response was successful (HTTP status 200-299)
    if (!res.ok) {
      // If not OK, read the response as text to see the HTML error page content
      const errorResponseText = await res.text();
      console.error(`HTTP error! Status: ${res.status} ${res.statusText}`);
      console.error(`Raw error response:`, errorResponseText);

      // Construct a more informative error message for the user
      if (res.status === 404) {
        errorMessage = "Media API endpoint not found. Please check the URL.";
      } else if (res.status === 500) {
        errorMessage = "Server error fetching media. Please try again later.";
      } else {
        errorMessage = `Failed to load media (Status: ${res.status}).`;
      }
      // Re-throw to be caught by the outer catch block
      throw new Error(`API fetch failed with status ${res.status}`);
    }

    // Attempt to parse JSON. This is where your original error occurred.
    // If res.ok was true but the content isn't JSON, .json() will throw.
    const data = await res.json();
    console.log("Successfully fetched data:", data);

    // Validate the structure of the fetched data
    if (!data || !Array.isArray(data.mediaItems)) {
      errorMessage = "Invalid data structure received from media API.";
      throw new Error("Received data is not an array of mediaItems.");
    }

    mediaItems = data.mediaItems as MediaItem[];

  } catch (error) { // <-- **THIS IS THE CRITICAL CHANGE: Removed ': any'**
    console.error("Caught error in ImagesPage component:", error);
    // If errorMessage was not already set by an HTTP error, set a generic one
    if (!errorMessage) {
      // Safely check if the error is an instance of Error
      if (error instanceof Error) {
        errorMessage = `An unexpected error occurred: ${error.message}`;
      } else {
        // Handle cases where the thrown 'error' is not an Error instance (e.g., a string or object)
        errorMessage = "An unexpected error occurred while loading media.";
      }
    }
  }

  // Render error message if an error occurred
  if (errorMessage) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Media
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {errorMessage}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Please check your API route (`/api/media`) and ensure `NEXT_PUBLIC_SITE_URL` is set correctly in your environment variables.
        </Typography>
      </Box>
    );
  }

  // Render the actual content
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        ధ్వని దృశ్యం {/* Telugu for "Audio Visual" or "Sound and Sight" */}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 3,
        }}
      >
        {mediaItems.length === 0 ? (
          <Typography variant="body1" sx={{ gridColumn: '1 / -1', textAlign: 'center', p: 4, border: '1px dashed #ccc', borderRadius: 2 }}>
            No media items found. Please add media to your API response.
          </Typography>
        ) : (
          mediaItems.map((file) => (
            <Box
              key={file.name}
              sx={{
                border: "1px solid #ccc",
                p: 2,
                borderRadius: 2,
                textAlign: "center",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
                {file.name}
              </Typography>

              {file.audio && (
                <audio controls style={{ width: "100%", maxWidth: "300px", marginTop: "10px" }}>
                  <source src={file.audio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}

              {file.video && (
                <video
                  controls
                  width="100%" // Make video responsive to container width
                  style={{ maxWidth: "400px", marginTop: "10px", borderRadius: "8px" }}
                >
                  <source src={file.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}

              {!file.audio && !file.video && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  No audio or video for this item.
                </Typography>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}