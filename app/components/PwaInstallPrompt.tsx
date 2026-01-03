'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Fab,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIOS(ios);

    if (ios && !standalone) {
      setShowPrompt(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* ⬇️ LEFT Floating Install Button */}
      <Fab
        color="primary"
        aria-label="Install App"
        onClick={() => setShowPrompt(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 90, md: 24 }, // bottom nav పైన
          left: 20,
          zIndex: 1500,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <DownloadIcon />
      </Fab>

      {/* 📦 Install Popup */}
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
        <Typography variant="subtitle1" fontWeight="bold">
          {isIOS ? 'iPhone లో App Install చేయండి' : 'App Install చేయండి'}
        </Typography>

        {isIOS ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            1. Safari లో ఈ సైట్ ఓపెన్ చేయండి <br />
            2. Share బటన్ నొక్కండి <br />
            3. “Add to Home Screen” ఎంచుకోండి
          </Typography>
        ) : (
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleInstall}
          >
            App Install చేయండి
          </Button>
        )}
      </Paper>
    </>
  );
}
