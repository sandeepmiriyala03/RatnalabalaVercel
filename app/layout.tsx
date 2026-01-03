import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import FloatingAIButton from "@/app/components/FloatingAIButton";

import {
  AppBar,
  Toolbar,
  Container,
  Box,
} from "@mui/material";

export const metadata = {
  title: "రత్నాలబాల",
  description: "రత్నాలబాల",
  verification: {
    google: "iFv4A22XfCP550a1-K4ZS3eHmGUtGWWSrOhjE9aPyGQ",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon.png",
    shortcut: "/icons/favicon.png",
    apple: "/icons/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "రత్నాలబాల",
  },
};

export const viewport = {
  themeColor: "#6200ee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="te">
      <body>
        {/* 🔝 Top AppBar */}
        <AppBar position="fixed" color="default" elevation={2}>
          <Toolbar
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Navbar />
          </Toolbar>
        </AppBar>

        {/* Spacer for fixed AppBar */}
        <Toolbar />

        {/* 🧱 Main Content */}
        <Container sx={{ my: 4 }}>
          <Box sx={{ pb: { xs: 8, md: 0 } }}>
            <ClientWrapper>{children}</ClientWrapper>
          </Box>
        </Container>

        {/* 📱 Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* ⬇️ PWA Install Button (LEFT floating) */}
        <PwaInstallPrompt />

        {/* 🤖 AI Chatbot Button (RIGHT floating – ALL devices) */}
        <FloatingAIButton />
      </body>
    </html>
  );
}
