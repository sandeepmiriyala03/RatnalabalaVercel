import { defineTool } from "eve/tools";
import { kv } from "@vercel/kv";

const BASE_URL = "https://ratnalabala.vercel.app";

const SAMETALU_FILES = [
  "a", "aa", "am", "ba", "bha", "ca", "cha", "da", "da2", "dha", "dha2",
  "e", "ee", "ga", "ha", "i", "ja", "ka", "ksha", "la", "ma", "na2",
  "o", "oo", "pa", "ra", "sa", "sha", "ssa", "tha2", "u", "uu", "va",
];

async function pickRandomPoem() {
  const res = await fetch(`${BASE_URL}/api/poems`);
  const data: Record<string, string> = await res.json();
  const titles = Object.keys(data);
  const title = titles[Math.floor(Math.random() * titles.length)];
  return { category: "poem", title, text: data[title] };
}

async function pickRandomKatha() {
  const res = await fetch(`${BASE_URL}/api/kathamala`);
  const data: Record<string, string> = await res.json();
  const titles = Object.keys(data);
  const title = titles[Math.floor(Math.random() * titles.length)];
  return { category: "katha", title, text: data[title] };
}

async function pickRandomSameta() {
  const filename = SAMETALU_FILES[Math.floor(Math.random() * SAMETALU_FILES.length)];
  const res = await fetch(`${BASE_URL}/ssmetalamala/${filename}.json`);
  const data = await res.json();
  const items = data.sametalu ?? [];
  const item = items[Math.floor(Math.random() * items.length)];
  return { category: "sameta", title: item?.text?.slice(0, 40) ?? "", text: item?.text ?? "" };
}

function getCurrentSlotCategory() {
  const hour = new Date().getUTCHours();
  const slotIndex = Math.floor(hour / 6) % 3;
  return (["poem", "katha", "sameta"])[slotIndex];
}

export default defineTool({
  description: "current 6-hour time slot based poem, katha, or sameta selector",
  inputSchema: {
    type: "object",
    properties: {
      trigger: {
        type: "string",
        description: "Optional trigger reason, not used",
      },
    },
  },
  async execute() {
    const category = getCurrentSlotCategory();

    let content;
    if (category === "poem") content = await pickRandomPoem();
    else if (category === "katha") content = await pickRandomKatha();
    else content = await pickRandomSameta();

    const payload = { ...content, updatedAt: new Date().toISOString() };

    await kv.set("featured-content", JSON.stringify(payload));

    return payload;
  },
});
