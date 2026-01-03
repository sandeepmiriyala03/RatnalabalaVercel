"use client";

import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import ChatIcon from "@mui/icons-material/Chat";
import InfoIcon from "@mui/icons-material/Info";

import { usePathname, useRouter } from "next/navigation";

const items = [
  { label: "మిరా", path: "/", icon: <HomeIcon /> },
  { label: "పద్యాలు", path: "/poems", icon: <MenuBookIcon /> },

  { label: "అంకితం", path: "/Dedication", icon: <InfoIcon /> },
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
