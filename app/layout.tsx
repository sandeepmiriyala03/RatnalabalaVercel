import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";
import {
  AppBar,
  Toolbar,
  Container,
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
    Description: "రత్నాలబాల",
  },
};
export const viewport = {
  themeColor: "#6200ee", // ✅ Required fix
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppBar position="fixed" color="default" elevation={2}>
          <Toolbar
            sx={{
              justifyContent: "space-between",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Navbar />
          </Toolbar>
        </AppBar>
        <Toolbar />

        <Container sx={{ my: 4 }}>
          <ClientWrapper>{children}</ClientWrapper>
        </Container>
      </body>
    </html>
  );
}
