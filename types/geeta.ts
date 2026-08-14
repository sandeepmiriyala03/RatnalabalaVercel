export interface GeetaChapterMeta {
  key: number;
  label: string;
  totalVerses: number;
}

export const GEETA_CHAPTERS: GeetaChapterMeta[] = [
  { key: 1, label: "అర్జున విషాద యోగం", totalVerses: 47 },
  { key: 2, label: "సాంఖ్య యోగం", totalVerses: 72 }
];

export const DEFAULT_CHAPTER_KEY = 1;
