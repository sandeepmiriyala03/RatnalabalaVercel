'use client';

import { useEffect, useState } from 'react';
import { Typography, Paper, Fab, IconButton, Snackbar, Alert } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
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

  /* One click, straight to the browser's own install dialog — no
     in-between confirm popup. iOS has no programmatic install API at
     all (Apple only allows "Add to Home Screen" through Safari's own
     Share menu, done by hand), so that's the one case a popup with
     manual steps is unavoidable rather than a UX choice. */
  const handleFabClick = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === 'accepted') {
      setShowWelcome(true);
    }
  };

  if (isInstalled || !ready) return null;

  return (
    <>
      {/* 📲 Install FAB — shows its label at all times (not just an
          icon) so a 60+ user knows what tapping it does before the
          first tap, and tapping it goes straight to install. */}
      <Fab
        variant="extended"
        aria-label="యాప్ ఇన్‌స్టాల్ చేయండి"
        onClick={handleFabClick}
        sx={{
          position: 'fixed',
          right: 12,
          bottom: 80,
          zIndex: 1600,
          height: 56,
          px: 2.5,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: 'var(--background)',
          fontWeight: 700,
          fontSize: '0.95rem',
          textTransform: 'none',
          boxShadow: '0 6px 20px color-mix(in srgb, var(--primary) 45%, transparent)',
          transition: 'transform 0.15s ease, filter 0.15s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            filter: 'brightness(1.08)',
            transform: 'scale(1.04)',
          },
          '&:focus-visible': {
            outline: '3px solid var(--primary)',
            outlineOffset: '4px',
          },
        }}
      >
        <InstallMobileIcon sx={{ mr: 1, fontSize: 26 }} />
        ఇన్‌స్టాల్ చేయండి
      </Fab>

      {/* 📦 iOS only — manual steps, since Apple gives no way to
          trigger this programmatically. */}
      {showIOSSteps && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 140, md: 100 },
            right: 16,
            maxWidth: 320,
            p: 2,
            pt: 1.5,
            zIndex: 1600,
            bgcolor: 'var(--surface-elevated)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Typography fontWeight="bold" sx={{ color: 'var(--foreground)' }}>
              App Install చేయండి
            </Typography>
            <IconButton
              size="small"
              aria-label="మూసివేయండి"
              onClick={() => setShowIOSSteps(false)}
              sx={{
                mt: -0.5, mr: -0.5,
                color: 'var(--muted-text)',
                '&:focus-visible': { outline: '3px solid var(--primary)', outlineOffset: '2px' },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </div>

          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6, color: 'var(--foreground)' }}>
            1. Safari లో ఈ సైట్ ఓపెన్ చేయండి<br />
            2. Share బటన్ నొక్కండి<br />
            3. “Add to Home Screen” ఎంచుకోండి
          </Typography>
        </Paper>
      )}

      {/* 🎉 Welcome toast — shown once, right after a successful
          install, instead of the app just silently closing the popup.
          Reassures a first-time/senior user that it actually worked. */}
      <Snackbar
        open={showWelcome}
        autoHideDuration={6000}
        onClose={() => setShowWelcome(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowWelcome(false)}
          icon={false}
          sx={{
            bgcolor: 'var(--secondary)',
            color: 'var(--background)',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-sm)',
            '& .MuiAlert-action': { color: 'var(--background)' },
          }}
        >
          🎉 స్వాగతం! యాప్ విజయవంతంగా ఇన్‌స్టాల్ అయ్యింది.
        </Alert>
      </Snackbar>
    </>
  );
}