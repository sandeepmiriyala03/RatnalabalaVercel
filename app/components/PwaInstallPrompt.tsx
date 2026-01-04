'use client';

import { useEffect, useState } from 'react';
import { Typography, Button, Paper, Fab } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // Detect already installed
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    setIsInstalled(installed);

    // Capture install prompt (Android / Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () =>
      window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setOpen(false);
  };

  // ❌ Already installed → show nothing
  if (isInstalled) return null;

  return (
    <>
      {/* 🔽 ALWAYS visible install button */}
      <Fab
        color="primary"
        aria-label="Install App"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 90, md: 24 },
          left: 20,
          zIndex: 1500,
        }}
      >
        <DownloadIcon />
      </Fab>

      {/* 📦 Install popup */}
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 160, md: 90 },
            left: 16,
            maxWidth: 320,
            p: 2,
            zIndex: 1500,
          }}
        >
          <Typography fontWeight="bold">
            App Install చేయండి
          </Typography>

          {/* 🍎 iOS */}
          {isIOS ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              1. Safari లో ఈ సైట్ ఓపెన్ చేయండి<br />
              2. Share బటన్ నొక్కండి<br />
              3. “Add to Home Screen” ఎంచుకోండి
            </Typography>
          ) : deferredPrompt ? (
            /* 🤖 Android / Desktop */
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleInstall}
            >
              Install App
            </Button>
          ) : (
            /* ⚠️ Browser blocked install */
            <Typography variant="body2" sx={{ mt: 2 }}>
              Install ప్రస్తుతం అందుబాటులో లేదు.<br />
              Chrome rules ప్రకారం enable అవుతుంది.
            </Typography>
          )}
        </Paper>
      )}
    </>
  );
}
