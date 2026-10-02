/* 🔑 Poetry Keys */
export type PoetryKey =
  | "Jandhyala"
  | "Sumati"
  | "SriKalahastheeswara"
  | "KrishnaSatakam"
  | "NarayanaSatakam"
  | "Annamacharya"
  | "ShivanandaLahari"
  | "RamachandraPrabhu"
  | "YajnavalkyaSatakam"
  | "DasarathiKaruNapaYonidhi"
  | "TeaShatakam";

/* 📘 Poetry Meta */
export interface PoetryMeta {
  key: PoetryKey;
  /** PostgreSQL poets.poet_id → /api/getpoems?poet_id=... */
  poetId: number;
  label: string;
  authors: string | string[];
  /** Fallback only — the page shows the live count from the database */
  totalPoems?: number;
}

/* 📜 One poem, as every page and component uses it */
export interface Poem {
  poem_id?: number;
  title: string;
  content: string;
  special_line?: string | null;
  poet_id?: number;
  poet_name?: string;
  slug?: string;
}

/* 📚 All Poetry Collections (poet_id from PostgreSQL poets table) */
export const POETRY_COLLECTIONS: PoetryMeta[] = [
  { key: "Jandhyala", poetId: 3, label: "తెలుగుబాల", authors: "శ్రీ జంధ్యాల పాపయ్య శాస్త్రి గారు", totalPoems: 100 },
  { key: "Sumati", poetId: 4, label: "సుమతీ", authors: "శ్రీ బద్దెన గారు", totalPoems: 110 },
  { key: "SriKalahastheeswara", poetId: 5, label: "శ్రీకాళహస్తీశ్వర", authors: "శ్రీ ధూర్జటి గారు", totalPoems: 115 },
  { key: "KrishnaSatakam", poetId: 6, label: "కృష్ణ", authors: "శ్రీ నరసింహ కవి గారు", totalPoems: 101 },
  { key: "NarayanaSatakam", poetId: 7, label: "నారాయణ", authors: "శ్రీ బమ్మెర పోతన గారు", totalPoems: 105 },
  { key: "Annamacharya", poetId: 8, label: "శ్రీ వేంకటేశ్వర", authors: "శ్రీ తాళ్లపాక అన్నమాచార్యుఁడు గారు", totalPoems: 91 },
  { key: "ShivanandaLahari", poetId: 9, label: "శివానందలహరి", authors: "శ్రీ ఆది శంకరాచార్యులు గారు", totalPoems: 100 },
  { key: "RamachandraPrabhu", poetId: 10, label: "రామచంద్ర ప్రభు", authors: "శ్రీ కూచి నరసింహము గారు", totalPoems: 99 },
  { key: "YajnavalkyaSatakam", poetId: 11, label: "శ్రీ యాజ్ఞవల్క్య", authors: "శ్రీ చింతా రామకృష్ణారావు గారు", totalPoems: 108 },
  { key: "DasarathiKaruNapaYonidhi", poetId: 12, label: "శ్రీ దాశరథీ కరుణాపయోనిధీ", authors: "శ్రీ భద్రాచల రామదాసు గారు", totalPoems: 103 },
  { key: "TeaShatakam", poetId: 13, label: "టీ శతకం", authors: "శ్రీ ప్రసాదరావు మిరియాల గారు", totalPoems: 108 },
];

/* ⭐ Default */
export const DEFAULT_POETRY_KEY: PoetryKey = "Jandhyala";

/* ✍️ "a, b" for display */
export const authorsToText = (authors: string | string[]) =>
  Array.isArray(authors) ? authors.join(", ") : authors;