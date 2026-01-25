/* Telugu letters used in Sametalu */
export type TeluguLetter =
  | "all"
  | "అ" | "ఆ" | "ఇ" | "ఈ" | "ఉ" | "ఊ" | "ఋ"
  | "ఎ" | "ఏ" | "ఐ" | "ఒ" | "ఓ" | "ఔ"
  | "అం" | "అః"
  | "క" | "ఖ" | "గ" | "ఘ" | "చ" | "ఛ" | "జ" | "ఝ"
  | "ట" | "ఠ" | "డ" | "ఢ" | "ణ"
  | "త" | "థ" | "ద" | "ధ" | "న"
  | "ప" | "ఫ" | "బ" | "భ" | "మ"
  | "య" | "ర" | "ల" | "వ"
  | "శ" | "ష" | "స" | "హ" | "ళ" | "క్ష" | "జ్ఞ" | "ఱ";

/* ✅ DEFAULT */
export const DEFAULT_LETTER: TeluguLetter = "all";

/* ✅ DROPDOWN GROUPS (USED IN PAGE) */
export const SAMETALU_GROUPS: {
  key: TeluguLetter;
  label: string;
}[] = [
  { key: "all", label: "అన్ని సామెతలు" },

  { key: "అ", label: "అ" },
  { key: "ఆ", label: "ఆ" },
  { key: "ఇ", label: "ఇ" },
  { key: "ఈ", label: "ఈ" },
  { key: "ఉ", label: "ఉ" },
  { key: "ఊ", label: "ఊ" },
  { key: "ఋ", label: "ఋ" },
  { key: "ఎ", label: "ఎ" },
  { key: "ఏ", label: "ఏ" },
  { key: "ఐ", label: "ఐ" },
  { key: "ఒ", label: "ఒ" },
  { key: "ఓ", label: "ఓ" },
  { key: "ఔ", label: "ఔ" },
  { key: "అం", label: "అం" },
  { key: "అః", label: "అః" },

  { key: "క", label: "క" },
  { key: "ఖ", label: "ఖ" },
  { key: "గ", label: "గ" },
  { key: "ఘ", label: "ఘ" },
  { key: "చ", label: "చ" },
  { key: "ఛ", label: "ఛ" },
  { key: "జ", label: "జ" },
  { key: "ఝ", label: "ఝ" },

  { key: "ట", label: "ట" },
  { key: "ఠ", label: "ఠ" },
  { key: "డ", label: "డ" },
  { key: "ఢ", label: "ఢ" },
  { key: "ణ", label: "ణ" },

  { key: "త", label: "త" },
  { key: "థ", label: "థ" },
  { key: "ద", label: "ద" },
  { key: "ధ", label: "ధ" },
  { key: "న", label: "న" },

  { key: "ప", label: "ప" },
  { key: "ఫ", label: "ఫ" },
  { key: "బ", label: "బ" },
  { key: "భ", label: "భ" },
  { key: "మ", label: "మ" },

  { key: "య", label: "య" },
  { key: "ర", label: "ర" },
  { key: "ల", label: "ల" },
  { key: "వ", label: "వ" },

  { key: "శ", label: "శ" },
  { key: "ష", label: "ష" },
  { key: "స", label: "స" },
  { key: "హ", label: "హ" },
  { key: "ళ", label: "ళ" },
  { key: "క్ష", label: "క్ష" },
  { key: "జ్ఞ", label: "జ్ఞ" },
  { key: "ఱ", label: "ఱ" },
];

/* 📜 Sameta */
export interface Sameta {
  id: string;
  text: string;
}

/* 📦 JSON file structure */
export interface SametaluFile {
  letter: string;
  count: number;
  sametalu: Sameta[];
}

/* 🔤 Telugu → ENGLISH filename mapping */
export const SAMETALU_FILE_MAP: Record<TeluguLetter, string> = {
  all: "all",

  "అ": "a",
  "ఆ": "aa",
  "ఇ": "i",
  "ఈ": "ii",
  "ఉ": "u",
  "ఊ": "uu",
  "ఋ": "ru",
  "ఎ": "e",
  "ఏ": "ee",
  "ఐ": "ai",
  "ఒ": "o",
  "ఓ": "oo",
  "ఔ": "au",
  "అం": "am",
  "అః": "ah",

  "క": "ka",
  "ఖ": "kha",
  "గ": "ga",
  "ఘ": "gha",
  "చ": "ca",
  "ఛ": "cha",
  "జ": "ja",
  "ఝ": "jha",

  "ట": "ta",
  "ఠ": "tha",
  "డ": "da",
  "ఢ": "dha",
  "ణ": "na",

  "త": "tha2",
  "థ": "tha3",
  "ద": "da2",
  "ధ": "dha2",
  "న": "na2",

  "ప": "pa",
  "ఫ": "pha",
  "బ": "ba",
  "భ": "bha",
  "మ": "ma",

  "య": "ya",
  "ర": "ra",
  "ల": "la",
  "వ": "va",

  "శ": "sha",
  "ష": "ssa",
  "స": "sa",
  "హ": "ha",
  "ళ": "lla",
  "క్ష": "ksha",
  "జ్ఞ": "jna",
  "ఱ": "rra",
};
