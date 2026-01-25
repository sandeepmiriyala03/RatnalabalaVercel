"use client";

import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ImageIcon from "@mui/icons-material/Image";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { label: "మిరా", path: "/", icon: <HomeIcon /> },
  { label: "పద్యాలవాల", path: "/poems", icon: <MenuBookIcon /> },
  { label: "మిరా ", path: "/mirapoems", icon: <AutoStoriesIcon /> },
  { label: "శతకాలమాల", path: "/shatakamu", icon: <LibraryBooksIcon /> },
  { label: "చిత్రమాల", path: "/chitramala", icon: <ImageIcon /> },
  { label: "కథామాల", path: "/kathamala", icon: <AutoStoriesIcon /> },
  { label: "సామెతలమాల", path: "/sametalu", icon: <MenuBookIcon /> },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", md: "none" },
        zIndex: 1300,
      }}
    >
      <BottomNavigation
        value={pathname}
        onChange={(_, value) => router.push(value)}
        showLabels
        sx={{
          padding: "4px 0",
          "& .Mui-selected": {
            color: "primary.main",
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
            sx={{
              minWidth: 0,
              padding: "6px 8px",
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
                marginTop: "2px",
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
