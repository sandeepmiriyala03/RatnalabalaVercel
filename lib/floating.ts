/* Shared sizes for the floating buttons on every page.
   Kept in its own file so RootClientLayout and PwaInstallPrompt
   can both use it without importing each other. */

export const FAB_HEIGHT = 56;
export const FAB_GAP = 12;
export const FAB_EDGE = 16;

/* Above page content, below AppBar (1100), drawers (1200), dialogs (1300) */
export const FAB_Z = 1050;

/* Big, labelled, easy-to-tap pill used by every floating button */
export const fabSx = {
  height: FAB_HEIGHT,
  px: 2.5,
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "1rem",
  textTransform: "none" as const,
  gap: 1,
  boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
  "& .MuiSvgIcon-root": { fontSize: 26 },
};