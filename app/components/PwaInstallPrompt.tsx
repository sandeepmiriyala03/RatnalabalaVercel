'use client';

import { useEffect, useState } from 'react';
import { Typography, Paper, Fab, IconButton, Snackbar, Alert } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { fabSx, FAB_EDGE, FAB_GAP, FAB_HEIGHT } from '@/lib/floating';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/* Set by the early script in layout.tsx */
type InstallWindow = Window & { __installPrompt?: BeforeInstallPromptEvent | null };

/* Which manual-steps message to show when there's no one-tap install */
type StepsKind = 'ios' | 'macSafari' | 'chromeMenu' | 'unsupported' | null;

const STEP_TEXT: Record<Exclude<StepsKind, null>, string> = {
  ios: '1. Safari లో ఈ సైట్ ఓపెన్ చేయండి\n2. Share బటన్ (□↑) నొక్కండి\n3. "Add to Home Screen" ఎంచుకోండి',
  macSafari: '1. మెనూ బార్‌లో File నొక్కండి\n2. "Add to Dock…" ఎంచుకోండి\n3. Add నొక్కండి',
  /* Chrome/Edge only allow the one-tap prompt once per visit; after
     that (or if it hasn't fired yet) the browser menu still works */
  chromeMenu:
    'కంప్యూటర్‌లో: అడ్రస్ బార్ కుడివైపు ఉన్న ఇన్‌స్టాల్ గుర్తు (⊕) నొక్కండి.\n\nఫోన్‌లో:\n1. బ్రౌజర్ మెనూ (⋮) నొక్కండి\n2. "Install app" లేదా "Add to Home screen" ఎంచుకోండి',
  unsupported:
    'మీ బ్రౌజర్‌లో ప్రత్యక్ష యాప్ ఇన్‌స్టాల్ లభ్యం కాదు. ఈ పేజీని బుక్‌మార్క్ చేసుకోండి, లేదా Chrome / Edge బ్రౌజర్‌లో తెరిచి ఇన్‌స్టాల్ చేయండి.',
};

const WELCOME_TEXT = 'స్వాగతం! రత్నాలబాల–జ్ఞానమాల ఇప్పుడు మీ ఫోన్‌లో సిద్ధంగా ఉంది.';

/* The steps card sits just above the two right-side buttons */
const STEPS_BOTTOM = `calc(${FAB_EDGE + FAB_HEIGHT * 2 + FAB_GAP * 2}px + env(safe-area-inset-bottom, 0px))`;

/* Renders as the TOP button in the right-side stack (RootClientLayout
   positions it). Renders nothing once the app is installed, and the
   search button below simply moves down into its place. */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [isChromium, setIsChromium] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [steps, setSteps] = useState<StepsKind>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    /* iPadOS Safari reports itself as "Macintosh", so touch support
       is the second signal that catches a real iPad. */
    const appleTouch =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(appleTouch);

    setIsMacSafari(
      !appleTouch &&
        navigator.platform === 'MacIntel' &&
        ua.includes('safari') &&
        !ua.includes('chrome') &&
        !ua.includes('crios') &&
        !ua.includes('firefox') &&
        !ua.includes('edg')
    );

    setIsChromium(!appleTouch && /chrome|chromium|edg|samsungbrowser/.test(ua));

    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );

    /* The install event may already have fired before this component
       mounted; the early script in layout.tsx keeps it for us. */
    const w = window as InstallWindow;
    if (w.__installPrompt) setDeferredPrompt(w.__installPrompt);

    const onPrompt = () => {
      if (w.__installPrompt) setDeferredPrompt(w.__installPrompt);
    };
    /* Installed from the browser menu too: hide the button right away */
    const onInstalled = () => {
      w.__installPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setSteps(null);
    };

    window.addEventListener('installpromptready', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('installpromptready', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  /* Spoken welcome via /api/tts, ALONGSIDE the visual message (never
     instead of it). Fails silently if audio is blocked. */
  const playWelcomeVoice = async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: WELCOME_TEXT, source: 'edge', voice: 'male' }),
      });
      if (!res.ok) return;
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      // The visual message is the fallback.
    }
  };

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      // Chrome allows each install event to be used only once
      (window as InstallWindow).__installPrompt = null;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') {
        setShowWelcome(true);
        void playWelcomeVoice();
      }
      return;
    }
    if (isIOS) return setSteps('ios');
    if (isMacSafari) return setSteps('macSafari');
    if (isChromium) return setSteps('chromeMenu');
    setSteps('unsupported');
  };

  if (isInstalled) {
    // Keep the welcome message visible right after installing
    return showWelcome ? <WelcomeToast open onClose={() => setShowWelcome(false)} /> : null;
  }

  return (
    <>
      <Fab
        variant="extended"
        onClick={handleClick}
        aria-haspopup={deferredPrompt ? undefined : 'dialog'}
        aria-expanded={steps ? true : undefined}
        sx={{
          ...fabSx,
          /* Solid terracotta: ivory text is 7.4:1. (The old orange
             gradient dropped to ~3:1 at its light end.) */
          bgcolor: 'var(--primary)',
          color: 'var(--background)',
          '&:hover': { bgcolor: 'var(--primary)', filter: 'brightness(1.08)' },
        }}
      >
        <InstallMobileIcon />
        ఇన్‌స్టాల్ చేయండి
      </Fab>

      {steps && (
        <Paper
          role="dialog"
          aria-labelledby="pwa-steps-title"
          elevation={8}
          sx={{
            position: 'fixed',
            right: `calc(${FAB_EDGE}px + env(safe-area-inset-right, 0px))`,
            left: { xs: `calc(${FAB_EDGE}px + env(safe-area-inset-left, 0px))`, sm: 'auto' },
            bottom: STEPS_BOTTOM,
            maxWidth: { sm: 340 },
            p: 2,
            pt: 1.5,
            bgcolor: 'var(--surface-elevated)',
            color: 'var(--foreground)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Typography id="pwa-steps-title" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              యాప్ ఇన్‌స్టాల్ చేయడం ఎలా
            </Typography>
            <IconButton aria-label="మూసివేయండి" onClick={() => setSteps(null)} sx={{ color: 'var(--foreground)', mr: -1 }}>
              <CloseRoundedIcon />
            </IconButton>
          </div>

          <Typography sx={{ mt: 1, lineHeight: 1.9, fontSize: '1rem', whiteSpace: 'pre-line' }}>
            {STEP_TEXT[steps]}
          </Typography>
        </Paper>
      )}

      <WelcomeToast open={showWelcome} onClose={() => setShowWelcome(false)} />
    </>
  );
}

function WelcomeToast({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={8000}   /* a little longer, for slower readers */
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }} /* clear of the bottom buttons */
    >
      <Alert
        onClose={onClose}
        icon={false}
        sx={{
          bgcolor: 'var(--secondary)',
          color: 'var(--background)',
          fontWeight: 700,
          fontSize: '1rem',
          borderRadius: 'var(--radius-sm)',
          '& .MuiAlert-action': { color: 'var(--background)' },
        }}
      >
        🎉 {WELCOME_TEXT}
      </Alert>
    </Snackbar>
  );
}