/* ═══════════════════════════════════════════════════════════════
   భావాలమాల AI — సహాయకుల (tools) జాబితా, ఒకే చోట

   Server (poemAI.tsx) మరియు బ్రౌజర్ (PoemCard.tsx) రెండూ దీన్నే
   చదువుతాయి. "use client" / "use server" లేదు — ఇది సాదా సమాచారం.

   కొత్త సహాయకుడిని చేర్చాలంటే:
     1. ఇక్కడ POEM_TOOLS లో ఒక entry
     2. poemAI.tsx లో streamUI tools లో దాని generate
   PoemCard లోని chips, సంఖ్య, system prompt సూచన ఆటోమేటిక్‌గా వస్తాయి.
   ═══════════════════════════════════════════════════════════════ */

export type PoemToolName = "showPadalu" | "explainWords";

export type PoemToolInfo = {
  name: PoemToolName;
  /** తెరపై పేరు */
  label: string;
  /** chip నొక్కితే పంపే ఉదాహరణ ప్రశ్న */
  example: string;
  /** Groq కి: ఈ సహాయకుడిని ఎప్పుడు పిలవాలి */
  description: string;
};

export const POEM_TOOLS: readonly PoemToolInfo[] = [
  {
    name: "showPadalu",
    label: "పాదాల విభజన",
    example: "ఈ పద్యాన్ని పాదాలుగా విడదీసి చూపించు",
    description: "పద్యాన్ని పాదాలుగా విడదీసి చూపించమని అడిగినప్పుడు వాడు.",
  },
  {
    name: "explainWords",
    label: "కఠిన పదాలు",
    example: "ఈ పద్యంలోని కఠిన పదాల అర్థాలు చెప్పు",
    description:
      "పద్యంలోని కఠిన పదాలు, వాటి సులభమైన అర్థాలు అడిగినప్పుడు వాడు. పద్యంలో నిజంగా ఉన్న పదాలనే ఇవ్వు.",
  },
];

/** సహాయకుడు అవసరం లేని మామూలు ప్రశ్న — పోలిక కోసం chip గా కూడా చూపిస్తాం */
export const PLAIN_EXAMPLE = {
  label: "భావం",
  example: "ఈ పద్యం భావం ఏమిటి? సులభంగా వివరించండి.",
} as const;

export function toolInfo(name: PoemToolName): PoemToolInfo {
  const info = POEM_TOOLS.find((t) => t.name === name);
  if (!info) throw new Error(`Unknown poem tool: ${name}`);
  return info;
}