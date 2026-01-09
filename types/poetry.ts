/* 🔑 Poetry Keys */
export type PoetryKey =
  | "Jandhyala";

/* 📘 Poetry Meta */
export interface PoetryMeta {
  key: PoetryKey;
  label: string;
  authors: string | string[];
}

/* 📚 All Poetry Collections */
export const POETRY_COLLECTIONS: PoetryMeta[] = [

  {
    key: "Jandhyala",
    label: "తెలుగుబాల శతకం",
    authors: "జంధ్యాల పాపయ్య శాస్త్రి",
  },
];

/* ⭐ Default */
export const DEFAULT_POETRY_KEY: PoetryKey = "Jandhyala";
