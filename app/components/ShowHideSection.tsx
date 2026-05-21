// components/ShowHideSection.tsx
"use client";

import React, { useState } from "react";
import { Box, Button } from "@mui/material";

type Props = {
  id: string;
  children: React.ReactNode;
  closedLabel?: string;   // button text when hidden
  openLabel?: string;     // button text when shown
  defaultOpen?: boolean;
  align?: "left" | "right" | "center";
};

const ShowHideSection: React.FC<Props> = ({
  id,
  children,
  closedLabel = "తెరువు",
  openLabel = "దాచు",
  defaultOpen = false,
  align = "right",
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const justifyContent =
    align === "left" ? "flex-start" : align === "center" ? "center" : "flex-end";

  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent, mb: open ? 1 : 0 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          aria-controls={id}
        >
          {open ? openLabel : closedLabel}
        </Button>
      </Box>

      {open && (
        <Box id={id}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default ShowHideSection;
