import fs from "fs";
import path from "path";

const INPUT_FILE = path.join(process.cwd(), "data", "sametalu_raw.txt");
const OUTPUT_DIR = path.join(process.cwd(), "output");

// Telugu vowels & consonant starters (extend if needed)
const TELUGU_LETTERS = [
  "అ","ఆ","ఇ","ఈ","ఉ","ఊ","ఋ","ఎ","ఏ","ఐ","ఒ","ఓ","ఔ",
  "క","ఖ","గ","ఘ","చ","ఛ","జ","ఝ",
  "ట","ఠ","డ","ఢ","ణ",
  "త","థ","ద","ధ","న",
  "ప","ఫ","బ","భ","మ",
  "య","ర","ల","వ",
  "శ","ష","స","హ","ళ","క్ష","జ్ఞ"
];

// ensure output dir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// read input
const raw = fs.readFileSync(INPUT_FILE, "utf-8");

// normalize lines
const lines = raw
  .replace(/\r/g, "")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

// group container
const groups = {};

// init groups
TELUGU_LETTERS.forEach(letter => {
  groups[letter] = [];
});

// group logic
lines.forEach(line => {
  const firstChar = line[0];
  if (groups[firstChar]) {
    groups[firstChar].push(line);
  }
});

// write JSON files
Object.entries(groups).forEach(([letter, items]) => {
  if (items.length === 0) return;

  const json = {
    letter,
    category: "సమేతామాల",
    language: "te",
    count: items.length,
    items: items.map((text, index) => ({
      id: index + 1,
      text
    }))
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${letter}.json`),
    JSON.stringify(json, null, 2),
    "utf-8"
  );
});

console.log("✅ Telugu Sametalu JSON generation completed.");
