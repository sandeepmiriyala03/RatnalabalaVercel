import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POETRY_FOLDERS = [
  "Jandhyala",
  "Sumati",
  "SriKalahastheeswara",
  "KrishnaSatakam",
  "NarayanaSatakam",
  "Annamacharya",
  "ShivanandaLahari",
  "RamachandraPrabhu",
  "YajnavalkyaSatakam",
  "DasarathiKaruNapaYonidhi",
  "TeaShatakam",
];

const SAMPLE_SIZE = 8;

type PoemEntry = {
  folder: string;
  title: string;
  content: string;
};

/* ── TOOL 1: deterministic, no AI ──
   Now returns BOTH the random sample AND the total poem count found
   across ALL folders — this total is what proves the agent actually
   scanned your full ~1140-poem corpus, not just a handful of test
   files. Shown in the UI so you can visually confirm it. */
function fetchPoemSample(sampleSize: number): {
  sample: PoemEntry[];
  totalScanned: number;
} {
  const all: PoemEntry[] = [];

  for (const folder of POETRY_FOLDERS) {
    // Scope filesystem access to the `content/` subfolder to avoid
    // tracing the entire project during the Next/Turbopack build.
    const dir = path.join(process.cwd(), "content", folder);
    
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const title = (data.title || "").trim();
      const poemText = content.trim();

      if (title && poemText) {
        all.push({ folder, title, content: poemText });
      }
    }
  }

  const shuffled = [...all].sort(() => Math.random() - 0.5);

  return {
    sample: shuffled.slice(0, sampleSize),
    totalScanned: all.length,
  };
}

/* ── TOOL 2 (MOCK): keyword list tuned to YOUR actual collections ── */
function fakeLLMChoose(sample: PoemEntry[]): {
  selectedIndex: number;
  reason: string;
} {
  const moodKeywords: { keyword: string; reason: string }[] = [
    // Sri Kalahastheeswara Satakam + Shivananda Lahari — Shiva devotion
    { keyword: "కాళహస్తీశ్వర", reason: "శ్రీకాళహస్తీశ్వర శతకంలోని శివభక్తి పద్యం కావడంతో ఎంచుకున్నాను." },
    { keyword: "శివ", reason: "శివుని ప్రస్తావన బలంగా ఉన్న పద్యం కావడంతో ఎంచుకున్నాను." },

    // Krishna Satakam — Krishna devotion
    { keyword: "కృష్ణ", reason: "కృష్ణ భక్తి భావం ఉట్టిపడుతున్న పద్యం కావడంతో ఎంచుకున్నాను." },

    // Dasarathi Karunapayonidhi + Ramachandraprabhu — Rama devotion
    { keyword: "దాశరథీ", reason: "రామనామ మహిమను ప్రస్తావించే దాశరథీ శతక పద్యం కావడంతో ఎంచుకున్నాను." },
    { keyword: "రామచంద్ర", reason: "రామచంద్రప్రభు స్తుతి పద్యం కావడంతో ఎంచుకున్నాను." },
    { keyword: "రామ", reason: "రామనామ ప్రస్తావన ఉన్న పద్యం కావడంతో ఎంచుకున్నాను." },

    // Narayana Satakam — Vishnu/Narayana devotion
    { keyword: "నారాయణ", reason: "నారాయణ శతకంలోని విష్ణు స్తుతి పద్యం కావడంతో ఎంచుకున్నాను." },

    // Annamacharya — Venkateswara/Alamelumanga
    { keyword: "వేంకటేశ్వర", reason: "అన్నమాచార్య వేంకటేశ్వర శతక పద్యం కావడంతో ఎంచుకున్నాను." },
    { keyword: "అలమేలుమంగ", reason: "అలమేలుమంగ అమ్మవారి ప్రస్తావన ఉన్న పద్యం కావడంతో ఎంచుకున్నాను." },

    // Yajnavalkya Satakam — guru devotion
    { keyword: "యాజ్ఞవల్క్య", reason: "యాజ్ఞవల్క్య గురుదేవర స్తుతి పద్యం కావడంతో ఎంచుకున్నాను." },
    { keyword: "గురుదేవర", reason: "గురు స్తుతి ప్రధానంగా ఉన్న పద్యం కావడంతో ఎంచుకున్నాను." },

    // Jandhyala Telugubala — Telugu pride / moral verses
    { keyword: "తెలుగుబాల", reason: "తెలుగు భాష మీద అభిమానం చాటే పద్యం కావడంతో ఎంచుకున్నాను." },
    { keyword: "తెలుగు", reason: "తెలుగు సాహిత్య గొప్పదనాన్ని చెప్పే పద్యం కావడంతో ఎంచుకున్నాను." },

    // Sumati Satakam — practical wisdom/niti
    { keyword: "సుమతీ", reason: "సుమతీ శతకంలోని లోకనీతి పద్యం కావడంతో ఎంచుకున్నాను." },

    // Tea Satakam — light, humorous mood
    { keyword: "టీ", reason: "తేలికపాటి, హాస్యభరితమైన టీ శతక పద్యం కావడంతో మార్పుగా ఎంచుకున్నాను." },
    { keyword: "కాఫీ", reason: "సరదాగా ఉండే కాఫీ శతక పద్యం కావడంతో మార్పుగా ఎంచుకున్నాను." },
  ];

  for (let i = 0; i < sample.length; i++) {
    const poem = sample[i];
    const match = moodKeywords.find((m) =>
      poem.content.includes(m.keyword) || poem.title.includes(m.keyword)
    );

    if (match) {
      return { selectedIndex: i + 1, reason: match.reason };
    }
  }

  const randomIndex = Math.floor(Math.random() * sample.length);
  return {
    selectedIndex: randomIndex + 1,
    reason:
      "నిర్దిష్ట keyword ఏదీ సరిపోలలేదు కాబట్టి యాదృచ్ఛికంగా ఎంచుకున్నాను (ఇది నిజమైన LLM reasoning కాదు, mock logic మాత్రమే).",
  };
}

/* ── THE AGENT ── */
export async function GET() {
  try {
    const { sample, totalScanned } = fetchPoemSample(SAMPLE_SIZE);

    if (sample.length === 0) {
      return NextResponse.json(
        { error: "పద్యాలు ఏవీ దొరకలేదు." },
        { status: 404 }
      );
    }

    const choice = fakeLLMChoose(sample);

    const index = Math.min(
      Math.max(choice.selectedIndex - 1, 0),
      sample.length - 1
    );
    const chosenPoem = sample[index];

    return NextResponse.json({
      success: true,
      poem: {
        folder: chosenPoem.folder,
        title: chosenPoem.title,
        content: chosenPoem.content,
      },
      agentReason: choice.reason,
      sampleSize: sample.length,
      // NEW — proves the agent scanned your full corpus, not a stub.
      // Should read ~1140 once wired to your real /md folders.
      totalScanned,
      mock: true,
    });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: "నిర్ణయాత్మక   మాల పనిచేయడంలో లోపం సంభవించింది." },
      { status: 500 }
    );
  }
}