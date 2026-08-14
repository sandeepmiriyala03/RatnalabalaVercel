'use client';

import { useEffect, useState } from 'react';
import { Typography, Button, Paper, Fab } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    setIsInstalled(installed);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setReady(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (ios && !installed) {
      setReady(true);
    }

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

  if (isInstalled || !ready) return null;

  return (
    <>
      {/* 📲 Floating Install FAB – RIGHT SIDE, bigger icon */}
      <Fab
        size="medium"
        aria-label="Install App"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          right: 12,
          bottom: 80,
          zIndex: 1600,
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
          color: '#fff',
          '&:hover': {
            background: 'linear-gradient(135deg, #00b7f0, #0066e0)',
          },
        }}
      >
        <InstallMobileIcon sx={{ fontSize: 32 }} />
      </Fab>

      {/* 📦 Install Popup – RIGHT SIDE */}
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 140, md: 100 },
            right: 16,
            maxWidth: 320,
            p: 2,
            zIndex: 1600,
          }}
        >
          <Typography fontWeight="bold">
            App Install చేయండి
          </Typography>

          {isIOS ? (
            <Typography
              variant="body2"
              sx={{ mt: 1, lineHeight: 1.6 }}
            >
              1. Safari లో ఈ సైట్ ఓపెన్ చేయండి<br />
              2. Share బటన్ నొక్కండి<br />
              3. “Add to Home Screen” ఎంచుకోండి
            </Typography>
          ) : deferredPrompt ? (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleInstall}
            >
              Install App
            </Button>
          ) : null}
        </Paper>
      )}
    </>
  );
}