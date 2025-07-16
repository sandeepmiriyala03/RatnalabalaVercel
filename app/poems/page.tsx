"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Typography, Box, List, ListItem, ListItemText } from "@mui/material";

export default function PoemsPage() {
  const [poems, setPoems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/poems")
      .then((res) => res.json())
      .then((data) => setPoems(data.poems));
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Poems
      </Typography>

      <List>
        {poems.map((poem) => (
          <ListItem key={poem.slug} button component={Link} href={`/poems/${poem.slug}`}>
            <ListItemText primary={poem.title} secondary={poem.author} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
