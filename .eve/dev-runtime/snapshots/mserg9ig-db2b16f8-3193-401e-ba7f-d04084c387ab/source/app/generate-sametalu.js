import fs from "fs";
import path from "path";

const INPUT_FILE = path.join(process.cwd(), "data", "sametalu_raw.txt");
const OUTPUT_DIR = path.join(process.cwd(), "public", "ssmetalamala");

/* Telugu → File name mapping */
const LETTER_MAP = {
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
  "ఱ": "rra"
};

// ensure output dir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// read raw file
const raw = fs.readFileSync(INPUT_FILE, "utf-8");

// normalize lines
const lines = raw
  .replace(/\r/g, "")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

// init groups
const groups = {};
Object.keys(LETTER_MAP).forEach(letter => {
  groups[letter] = [];
});

// grouping logic (handle multi-char like క్ష, జ్ఞ)
lines.forEach(line => {
  const match = Object.keys(LETTER_MAP)
    .sort((a, b) => b.length - a.length)
    .find(l => line.startsWith(l));

  if (match) {
    groups[match].push(line);
  }
});

// write JSON files
Object.entries(groups).forEach(([letter, items]) => {
  if (items.length === 0) return;

  const fileName = LETTER_MAP[letter];

  const json = {
    letter,
    file: fileName,
    category: "సామెతల మాల",
    language: "te",
    count: items.length,
    sametalu: items.map((text, index) => ({
      id: `${fileName}-${index + 1}`,
      text
    }))
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${fileName}.json`),
    JSON.stringify(json, null, 2),
    "utf-8"
  );
});

console.log("✅ Telugu Sametalu JSON files generated successfully!");
