'use client';

import { useEffect, useState } from 'react';
import { Typography, Paper, Fab, IconButton, Snackbar, Alert } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/* Which manual-steps message to show. Only reached when there's no
   direct install API — Chrome/Edge/Samsung Internet (any device) skip
   this entirely via deferredPrompt. */
type StepsKind = 'ios' | 'macSafari' | 'unsupported' | null;

const STEP_TEXT: Record<Exclude<StepsKind, null>, string> = {
  ios: '1. Safari లో ఈ సైట్ ఓపెన్ చేయండి\n2. Share బటన్ నొక్కండి\n3. "Add to Home Screen" ఎంచుకోండి',
  macSafari: '1. మెనూ బార్‌లో File నొక్కండి\n2. "Add to Dock…" ఎంచుకోండి\n3. Add నొక్కండి',
  unsupported:
    'మీ బ్రౌజర్‌లో ప్రత్యక్ష యాప్ ఇన్‌స్టాల్ లభ్యం కాదు. ఈ పేజీని బుక్‌మార్క్ చేసుకోండి, లేదా Chrome / Edge బ్రౌజర్‌లో తెరిచి ఇన్‌స్టాల్ చేయండి.',
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [steps, setSteps] = useState<StepsKind>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    /* iPhone/iPod self-report honestly; iPadOS Safari has reported
       itself as "Macintosh" since iPadOS 13, so touch capability is
       the second signal that catches a real iPad disguised as a Mac. */
    const appleTouch =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(appleTouch);

    /* Desktop (non-touch) Mac running actual Safari, not Chrome/Edge/
       Firefox (which all include "safari" in their UA string too). */
    const macSafari =
      !appleTouch &&
      navigator.platform === 'MacIntel' &&
      ua.includes('safari') &&
      !ua.includes('chrome') &&
      !ua.includes('crios') &&
      !ua.includes('firefox') &&
      !ua.includes('edg');
    setIsMacSafari(macSafari);

    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsInstalled(installed);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* On Chrome/Edge/Samsung Internet (desktop or mobile) this installs
     in one click. Everywhere else there is no programmatic install API
     — that's a real platform limit, not something fixable here — so
     the best available help is clear manual steps, or a bookmark
     suggestion when even manual "Add to Home Screen" doesn't exist. */
  const handleFabClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') setShowWelcome(true);
      return;
    }
    if (isIOS) return setSteps('ios');
    if (isMacSafari) return setSteps('macSafari');
    setSteps('unsupported');
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Always rendered — on every browser and device — instead of
          disappearing whenever no install event has fired. What
          happens on click adapts per browser (see handleFabClick). */}
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

      {/* Manual-steps popup — content swaps based on which browser was
          detected (iOS / Mac Safari / no install support at all). */}
      {steps && (
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
              onClick={() => setSteps(null)}
              sx={{
                mt: -0.5, mr: -0.5,
                color: 'var(--muted-text)',
                '&:focus-visible': { outline: '3px solid var(--primary)', outlineOffset: '2px' },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </div>

          <Typography
            variant="body2"
            sx={{ mt: 1, lineHeight: 1.6, color: 'var(--foreground)', whiteSpace: 'pre-line' }}
          >
            {STEP_TEXT[steps]}
          </Typography>
        </Paper>
      )}

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
         🎉 స్వాగతం! రత్నాలబాల–జ్ఞానమాల ఇప్పుడు మీ ఫోన్‌లో సిద్ధంగా ఉంది.
        </Alert>
      </Snackbar>
    </>
  );
}