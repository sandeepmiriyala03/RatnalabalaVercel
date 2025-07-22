'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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
      const event = e as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(event);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    });
  };

  if (!showPrompt) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        p: 2,
        maxWidth: 360,
        zIndex: 1300,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {isIOS ? 'Install App on iPhone' : 'Install this App'}
        </Typography>
        <IconButton size="small" onClick={() => setShowPrompt(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      {isIOS ? (
        <Box mt={1}>
          <Typography variant="body2">
            1. Safari బ్రౌజర్ లో ఈ పేజీని ఓపెన్ చేయండి<br />
            2. Share బటన్ పై క్లిక్ చేయండి<br />
            3. “Add to Home Screen” ఎంచుకోండి
          </Typography>
        </Box>
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
  );
}
