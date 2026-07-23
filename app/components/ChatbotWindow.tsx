"use client";

import { Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/*
  ══════════════════════════════════════════════════════════════════
  IMPROVEMENTS MADE HERE:

  1. PoetryKey is now DERIVED from POETRY_COLLECTIONS itself (via
     `as const` + a mapped type), instead of being a hand-maintained
     union that lives separately from the array. Before, adding a new
     శతకం meant remembering to update TWO places (the union AND the
     array) — miss one and TypeScript won't catch it. Now there's
     only one place to edit; the type always matches the data.

  2. Added `aliases` per collection — these feed directly into your
     ChatbotWindow.tsx's COLLECTION_ALIASES instead of that file
     hardcoding its own separate copy. Right now if you add a new
     శతకం here, the chatbot has no idea it exists until you also go
     edit ChatbotWindow.tsx by hand and add matching aliases there.
     A helper function below (buildAliasMap) generates that map
     automatically from this single source of truth.

  3. Added getCollectionByKey() / getCollectionByAlias() helpers so
     other files (ChatbotWindow, agent routes, etc.) don't need to
     re-implement lookup logic themselves.

  4. Flagged one data discrepancy below — see the comment on
     TeaShatakam.
  ══════════════════════════════════════════════════════════════════
*/

/* 📘 Poetry Meta */
export interface PoetryMeta {
  key: string;
  label: string;
  authors: string | string[];
  totalPoems?: number;
  // Short strings people might type to refer to this collection in
  // chat/search (Telugu name, English short forms, abbreviations).
  // "all" has none — it's a special case, not a real folder.
  aliases?: string[];
}

/* 📚 All Poetry Collections — single source of truth.
   `as const` lets PoetryKey (below) derive its union type directly
   from these `key` values, so the type and the data can never
   silently drift apart. */
export const POETRY_COLLECTIONS = [
  {
    key: "all",
    label: "📚 అన్ని శతకాలు",
    authors: "అనేక కవులు",
  },
  {
    key: "Jandhyala",
    label: "తెలుగుబాల",
    authors: "శ్రీ జంధ్యాల పాపయ్య శాస్త్రి గారు",
    totalPoems: 100,
    aliases: ["తెలుగుబాల", "jan", "j"],
  },
  {
    key: "Sumati",
    label: "సుమతీ",
    authors: "శ్రీ బద్దెన గారు",
    totalPoems: 110,
    aliases: ["సుమతి", "సుమతీ", "sumati", "s"],
  },
  {
    key: "SriKalahastheeswara",
    label: "శ్రీకాళహస్తీశ్వర",
    authors: "శ్రీ ధూర్జటి గారు",
    totalPoems: 115,
    aliases: ["శ్రీకాళహస్తీశ్వర", "కాళహస్తీశ్వర", "kalahasti", "sk"],
  },
  {
    key: "KrishnaSatakam",
    label: "కృష్ణ",
    authors: "శ్రీ నరసింహ కవి గారు",
    totalPoems: 101,
    aliases: ["కృష్ణ", "krishna", "kr"],
  },
  {
    key: "NarayanaSatakam",
    label: "నారాయణ",
    authors: "శ్రీ బమ్మెర పోతన గారు",
    totalPoems: 105,
    aliases: ["నారాయణ", "narayana", "na"],
  },
  {
    key: "Annamacharya",
    label: "శ్రీ వేంకటేశ్వర",
    authors: "శ్రీ తాళ్లపాక అన్నమాచార్యుఁడు గారు",
    totalPoems: 91,
    aliases: ["వేంకటేశ్వర", "అన్నమాచార్య", "annamacharya", "vk"],
  },
  {
    key: "ShivanandaLahari",
    label: "శివానందలహరి",
    authors: "శ్రీ ఆది శంకరాచార్యులు గారు",
    totalPoems: 100,
    aliases: ["శివానంద", "శివానందలహరి", "shivananda", "sl"],
  },
  {
    key: "RamachandraPrabhu",
    label: "రామచంద్ర ప్రభు",
    authors: "శ్రీ కూచి నరసింహము గారు",
    totalPoems: 99,
    aliases: ["రామచంద్ర", "రామచంద్రప్రభు", "ramachandra", "rc"],
  },
  {
    key: "YajnavalkyaSatakam",
    label: "శ్రీ యాజ్ఞవల్క్య ",
    authors: "శ్రీ చింతా రామకృష్ణారావు గారు",
    totalPoems: 108,
    aliases: ["యాజ్ఞవల్క్య", "yajnavalkya", "yv"],
  },
  {
    key: "DasarathiKaruNapaYonidhi",
    label: "శ్రీ దాశరథీ కరుణాపయోనిధీ",
    authors: "శ్రీ భద్రాచల రామదాసు గారు",
    totalPoems: 115,
    // NOTE — was 108 in the original file. Your actual poem dump has
    // entries numbered up to 115 for this collection (padyam 001
    // through 115). Double-check which number is right for your data
    // and adjust if 108 was intentional (e.g. some numbers skipped).
    aliases: ["దాశరథీ", "దశరథి", "dasarathi", "dk"],
  },
  {
    key: "TeaShatakam",
    label: "టీ శతకం",
    authors: "శ్రీ ప్రసాదరావు మిరియాల గారు",
    totalPoems: 108,
    // NOTE — was 100 in the original file. Your actual data has 100
    // "టీ శతకం" poems (1-100) PLUS 8 additional "కాఫీ శతకం" poems
    // (101-108) stored under the same TeaShatakam folder/key — so the
    // real total in this collection is 108, not 100. If you want Tea
    // and Coffee tracked as separate counts, consider splitting this
    // into two PoetryMeta entries instead of one.
    aliases: ["టీ", "కాఫీ", "tea", "coffee", "t"],
  },
] as const satisfies readonly PoetryMeta[];

/* PoetryKey is now DERIVED, not hand-maintained separately. */
export type PoetryKey = (typeof POETRY_COLLECTIONS)[number]["key"];

/* ── Helpers — so other files don't reimplement this lookup logic ── */

export function getCollectionByKey(key: string): PoetryMeta | undefined {
  return POETRY_COLLECTIONS.find((c) => c.key === key);
}

export function getCollectionByAlias(alias: string): PoetryMeta | undefined {
  const normalized = alias.trim().toLowerCase();
  return POETRY_COLLECTIONS.find((c) => {
    if (c.key.toLowerCase() === normalized) {
      return true;
    }

    if (!("aliases" in c)) {
      return false;
    }

    return c.aliases.some((a) => a.toLowerCase() === normalized);
  });
}

/* Builds the same shape ChatbotWindow.tsx's COLLECTION_ALIASES used
   to hardcode by hand — but generated automatically from the data
   above. Use this in ChatbotWindow.tsx instead of a second hardcoded
   copy: `const COLLECTION_ALIASES = buildAliasMap();` */
export function buildAliasMap(): Record<string, PoetryKey> {
  const map: Record<string, PoetryKey> = {};

  for (const collection of POETRY_COLLECTIONS) {
    if (collection.key === "all") continue;

    for (const alias of collection.aliases ?? []) {
      map[alias.toLowerCase()] = collection.key as PoetryKey;
    }
  }

  return map;
}

export default function ChatbotWindow({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">భావాలమాల – AI సహాయకుడు</Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close chatbot">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Chatbot experience is temporarily unavailable while the component is being restored.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}