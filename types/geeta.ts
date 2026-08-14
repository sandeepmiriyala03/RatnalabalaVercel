export interface GeetaChapterMeta {
  key: number;
  label: string;
  totalVerses: number;
}

export const GEETA_CHAPTERS: GeetaChapterMeta[] = [
  { key: 1, label: "అర్జున విషాద యోగం", totalVerses: 47 },
  { key: 2, label: "సాంఖ్య యోగం", totalVerses: 72 },
  { key: 3, label: "కర్మ యోగం", totalVerses: 43 },
  { key: 4, label: "జ్ఞాన కర్మ సన్న్యాస యోగం", totalVerses: 42 },
  { key: 5, label: "కర్మ సన్న్యాస యోగం", totalVerses: 29 },
  { key: 6, label: "ఆత్మసంయమ యోగం", totalVerses: 47 },
  { key: 7, label: "జ్ఞాన విజ్ఞాన యోగం", totalVerses: 30 },
  { key: 8, label: "అక్షర బ్రహ్మ యోగం", totalVerses: 28 },
  { key: 9, label: "రాజవిద్యా రాజగుహ్య యోగం", totalVerses: 34 },
  { key: 10, label: "విభూతి యోగం", totalVerses: 42 },
  { key: 11, label: "విశ్వరూప సందర్శన యోగం", totalVerses: 55 },
  { key: 12, label: "భక్తి యోగం", totalVerses: 20 },
  { key: 13, label: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగం", totalVerses: 34 },
  { key: 14, label: "గుణత్రయ విభాగ యోగం", totalVerses: 27 },
  { key: 15, label: "పురుషోత్తమ యోగం", totalVerses: 20 },
  { key: 16, label: "దైవాసుర సంపద్విభాగ యోగం", totalVerses: 24 },
  { key: 17, label: "శ్రద్ధాత్రయ విభాగ యోగం", totalVerses: 28 },
  { key: 18, label: "మోక్ష సన్న్యాస యోగం", totalVerses: 78 },
];

export const DEFAULT_CHAPTER_KEY = 1;