/* 🔑 Poetry Keys */
export type PoetryKey =
  | "all"
  | "Jandhyala"
  | "Sumati"
  | "SriKalahastheeswara"
  | "KrishnaSatakam"
  | "NarayanaSatakam"
  | "Annamacharya"
  | "ShivanandaLahari"
  | "RamachandraPrabhu"
  | "YajnavalkyaSatakam"; 

/* 📘 Poetry Meta */
export interface PoetryMeta {
  key: PoetryKey;
  label: string;
  authors: string | string[];
  totalPoems?: number;
}

/* 📚 All Poetry Collections */
export const POETRY_COLLECTIONS: PoetryMeta[] = [
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
  },
  {
    key: "Sumati",
    label: "సుమతీ",
    authors: "శ్రీ బద్దెన గారు",
    totalPoems: 110,
  },
  {
    key: "SriKalahastheeswara",
    label: "శ్రీకాళహస్తీశ్వర",
    authors: "శ్రీ ధూర్జటి గారు",
    totalPoems: 115,
  },
  {
    key: "KrishnaSatakam",
    label: "కృష్ణ",
    authors: "శ్రీ నరసింహ కవి గారు",
    totalPoems: 101,
  },
  {
    key: "NarayanaSatakam",
    label: "నారాయణ",
    authors: "శ్రీ బమ్మెర పోతన గారు",
    totalPoems: 105,
  },
  {
    key: "Annamacharya",
    label: "శ్రీ వేంకటేశ్వర",
    authors: "శ్రీ తాళ్లపాక అన్నమాచార్యుఁడు గారు",
    totalPoems: 91,
  },
  {
    key: "ShivanandaLahari",
    label: "శివానందలహరి",
    authors: "శ్రీ ఆది శంకరాచార్యులు గారు",
    totalPoems: 100,
  },
   {
    key: "RamachandraPrabhu",
    label: "రామచంద్ర ప్రభు",
    authors: "శ్రీ కూచి నరసింహము గారు",
    totalPoems: 99,
  },
    {
    key: "YajnavalkyaSatakam",
    label: "శ్రీ యాజ్ఞవల్క్య ",
    authors: "శ్రీ చింతా రామకృష్ణారావు గారు",
    totalPoems: 108,
  }
];

/* ⭐ Default */
export const DEFAULT_POETRY_KEY: PoetryKey = "all";
