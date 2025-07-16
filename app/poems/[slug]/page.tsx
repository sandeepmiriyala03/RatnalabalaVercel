import { Box, Typography } from "@mui/material";

async function getPoem(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/poems/${slug}`);
  return res.json();
}

export default async function PoemPage({ params }: { params: { slug: string } }) {
  const poem = await getPoem(params.slug);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {poem.title}
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        By {poem.author}
      </Typography>

      <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
        {poem.content}
      </Typography>

      {poem.audio && (
        <Box sx={{ mt: 2 }}>
          <audio controls>
            <source src={`/audio/${poem.audio}`} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </Box>
      )}
    </Box>
  );
}
