/* 🔑 Poetry Keys */
export type PoetryKey =
  | "Jandhyala"
  | "Sumati"
    | "SriKalahastheeswara";
  ;

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
    label: "తెలుగుబాల",
    authors: "జంధ్యాల పాపయ్య శాస్త్రి",
  },

  
  {
    key: "Sumati",
    label: "సుమతీ",
    authors: "బద్దెన",
  },
   {
    key: "SriKalahastheeswara",
    label: "శ్రీకాళహస్తీశ్వర",
    authors: " ధూర్జటి",
  },
];

/* ⭐ Default */
export const DEFAULT_POETRY_KEY: PoetryKey = "Jandhyala";



