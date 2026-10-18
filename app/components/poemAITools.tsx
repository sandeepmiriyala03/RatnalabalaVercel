/* ═══════════════════════════════════════════════════════════════
   భావాలమాల AI — సహాయకుల (tools) జాబితా, ఒకే చోట

   Server (poemAI.tsx) మరియు బ్రౌజర్ (PoemCard.tsx) రెండూ దీన్నే
   చదువుతాయి. "use client" / "use server" లేదు — ఇది సాదా సమాచారం.

   కొత్త సహాయకుడిని చేర్చాలంటే:
     1. ఇక్కడ POEM_TOOLS లో ఒక entry
     2. poemAI.tsx లో streamUI tools లో దాని generate
   PoemCard లోని dropdown, వివరణ, సంఖ్య, system prompt సూచన ఆటోమేటిక్‌గా వస్తాయి.
   ═══════════════════════════════════════════════════════════════ */

export type PoemToolName =
  | "showPadalu"
  | "explainWords"
  | "findSimilarPoems"
  | "findPoetPoems"
  | "matchSametha"
  | "listenPoem"
  | "makePoster";

export type PoemToolInfo = {
  name: PoemToolName;
  /** తెరపై పేరు */
  label: string;
  /** chip నొక్కితే పంపే ఉదాహరణ ప్రశ్న */
  example: string;
  /** Groq కి: ఈ సహాయకుడిని ఎప్పుడు పిలవాలి */
  description: string;
  /** వాడుకరికి: dropdown లో ఎంచుకోగానే కనిపించే సులభమైన వివరణ */
  about: string;
};

export const POEM_TOOLS: readonly PoemToolInfo[] = [
  {
    name: "showPadalu",
    label: "పాదాల విభజన",
    example: "ఈ పద్యాన్ని పాదాలుగా విడదీసి చూపించు",
    description: "పద్యాన్ని పాదాలుగా విడదీసి చూపించమని అడిగినప్పుడు వాడు.",
    about: "పద్యంలోని ఒక్కో పాదాన్ని వేరు వేరుగా, సంఖ్యతో చూపిస్తుంది. పద్యం ఎన్ని పాదాలో, ఒక్కో పాదం ఎక్కడ ముగుస్తుందో సులభంగా తెలుస్తుంది.",
  },
  {
    name: "explainWords",
    label: "కఠిన పదాలు",
    example: "ఈ పద్యంలోని కఠిన పదాల అర్థాలు చెప్పు",
    description:
      "పద్యంలోని కఠిన పదాలు, వాటి సులభమైన అర్థాలు అడిగినప్పుడు వాడు. పద్యంలో నిజంగా ఉన్న పదాలనే ఇవ్వు.",
    about: "పద్యంలో అర్థం కావడం కష్టమైన పదాలను ఎంచి, ఒక్కో పదానికి సులభమైన అర్థం చెబుతుంది. పిల్లలకు, కొత్తగా చదివేవారికి ఉపయోగం.",
  },
  {
    name: "findSimilarPoems",
    label: "ఇలాంటి పద్యాలు",
    example: "ఇలాంటి భావం ఉన్న ఇతర పద్యాలు చూపించు",
    description:
      "ఈ పద్యం లాంటి భావం ఉన్న ఇతర పద్యాలు, సామెతలు, కథలు database లో వెతకమని అడిగినప్పుడు వాడు. query లో ఈ పద్యం ముఖ్య భావాన్ని 2 నుంచి 6 తెలుగు పదాల్లో ఇవ్వు (ఉదా: \"కోపం వద్దు, సహనం\"). పద్యం మొత్తం పంపవద్దు.",
    about: "ఈ పద్యం భావాన్ని AI రెండు మూడు మాటల్లో పట్టుకుని, అదే భావం ఉన్న ఇతర పద్యాలు, సామెతలు, కథలు మా database లో వెతికి చూపిస్తుంది.",
  },
  {
    name: "findPoetPoems",
    label: "ఈ కవి ఇతర పద్యాలు",
    example: "ఈ కవి రాసిన ఇతర పద్యాలు చూపించు",
    description: "ఇదే కవి రాసిన ఇతర పద్యాలు చూపించమని అడిగినప్పుడు వాడు. input అవసరం లేదు; కవి ఎవరో మన code కి తెలుసు.",
    about: "ఇదే కవి రాసిన మరికొన్ని పద్యాలను మా database నుంచి తెచ్చి చూపిస్తుంది. ఈ పద్యం జాబితాలో రాదు. Database లో లేని పద్యాలకు (ఫైళ్ళ నుంచి వచ్చేవి) ఇది పనిచేయదు.",
  },
  {
    name: "matchSametha",
    label: "సామెత జత",
    example: "ఈ పద్యం నీతికి సరిపోయే సామెత చెప్పు",
    description:
      "పద్యం నీతికి సరిపోయే తెలుగు సామెత అడిగినప్పుడు వాడు. keywords లో సామెతల్లో కనిపించే 2 నుంచి 5 తెలుగు మాటలు ఇవ్వు (ఉదా: కోపం, ఓర్పు, డబ్బు). సామెతను నువ్వు రాయవద్దు; మన సామెతల మాల నుంచే వస్తుంది.",
    about: "పద్యం చెప్పే నీతిని AI కొన్ని మాటల్లో పట్టుకుంటుంది. ఆ మాటలతో మా సామెతల మాల లోని నిజమైన సామెతలు వెతికి, సరిపోయేవి చూపిస్తుంది. AI సొంతంగా సామెతలు కల్పించదు.",
  },
  {
    name: "listenPoem",
    label: "పద్యం వినిపించు",
    example: "ఈ పద్యం చదివి వినిపించు",
    description: "పద్యాన్ని చదివి వినిపించమని అడిగినప్పుడు వాడు. input అవసరం లేదు.",
    about: "జవాబులో \"ఇప్పుడు వినండి\" బటన్ వస్తుంది. నొక్కితే, మీరు పైన ఎంచుకున్న స్వరం, సంగీతంతో ఈ పద్యం చదివి వినిపిస్తుంది.",
  },
  {
    name: "makePoster",
    label: "పోస్టర్ చెయ్యి",
    example: "ఈ పద్యంతో పోస్టర్ చెయ్యి",
    description: "పద్యంతో పోస్టర్ / చిత్రం చేయమని అడిగినప్పుడు వాడు. input అవసరం లేదు.",
    about: "జవాబులో \"పోస్టర్ డౌన్‌లోడ్\" బటన్ వస్తుంది. నొక్కితే, పైన కనిపించే పద్యం కార్డు అలాగే ఒక చిత్రంగా (PNG) మీ ఫోన్‌కి వస్తుంది. WhatsApp లో పంచుకోవచ్చు.",
  },
];

/** findPoetPoems / matchSametha ఫలితాలు */
export type PoetPoem = { title: string; snippet: string };
export type Sametha = { text: string; matched: string[] };

/** వినిపించు / పోస్టర్: పని బ్రౌజర్‌లోనే జరుగుతుంది — జవాబులోని బటన్ ఈ event పంపుతుంది,
    అదే పద్యం కార్డు (poemKey) దాన్ని విని పని చేస్తుంది. */
export const POEM_AI_ACTION_EVENT = "poem-ai-action";
export type PoemClientAction = "listen" | "poster";
export type PoemAIActionDetail = { poemKey: string; action: PoemClientAction };

/** findSimilarPoems ఫలితం — database (/api/search) నుంచి వచ్చే ఒక్కో పద్యం */
export type SimilarPoem = {
  title: string;
  /** ఏ మాల నుంచి (శతకం, సామెతలు, గీత…) */
  mala: string;
  /** మొదటి కొన్ని పంక్తులు */
  snippet: string;
  /** సైట్‌లో ఆ పద్యం పేజీ — "/" తో మొదలయ్యేది లేదా https; లేకపోతే "" */
  link: string;
};

/** సహాయకుడు అవసరం లేని మామూలు ప్రశ్న — పోలిక కోసం chip గా కూడా చూపిస్తాం */
export const PLAIN_EXAMPLE = {
  label: "భావం",
  example: "ఈ పద్యం భావం ఏమిటి? సులభంగా వివరించండి.",
  about: "సహాయకుడు లేకుండా, Groq తన మాటలతోనే పద్యం భావాన్ని 4 చిన్న వాక్యాల్లో, చివర నీతితో చెబుతుంది. జవాబు మాట మాటగా వస్తుంది.",
} as const;

export function toolInfo(name: PoemToolName): PoemToolInfo {
  const info = POEM_TOOLS.find((t) => t.name === name);
  if (!info) throw new Error(`Unknown poem tool: ${name}`);
  return info;
}