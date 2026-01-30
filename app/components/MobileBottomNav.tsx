"use client";

import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ImageIcon from "@mui/icons-material/Image";
import { usePathname, useRouter } from "next/navigation";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";

const items = [
  { label: "మిరా", path: "/mirapoems", icon: <AutoStoriesIcon /> },
    { label:"అక్షర", path: "/aksharamala", icon: <LibraryBooksIcon /> },
    { label:"పద్యాలవాల", path: "/poems", icon: <MenuBookIcon /> },
  { label: "శతక", path: "/shatakamu", icon: <LibraryBooksIcon /> },
  { label: "చిత్ర", path: "/chitramala", icon: <ImageIcon /> },
  { label: "కథ", path: "/kathamala", icon: <AutoStoriesIcon /> },
  { label: "సామెత", path: "/sametalu", icon: <MenuBookIcon /> },
  { label: "లిపి", path: "/lipimala", icon: <DocumentScannerIcon /> },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Paper
      elevation={12}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", md: "none" },
        zIndex: 1400,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
      }}
    >
      <BottomNavigation
        value={pathname}
        onChange={(_, value) => router.push(value)}
        showLabels
        sx={{
          height: 64,
          px: 0.5,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            px: 0.5,
            py: 0.5,
            borderRadius: 2,
          },
          "& .Mui-selected": {
            color: "primary.main",
            backgroundColor: "rgba(25, 118, 210, 0.12)",
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.7rem",
            lineHeight: 1.2,
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
