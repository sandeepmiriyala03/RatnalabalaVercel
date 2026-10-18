/* ═══════════════════════════════════════════════════════════════
   భావాలమాల AI — server side (AI SDK RSC)

   ఈ ఫైల్ server లో మాత్రమే నడుస్తుంది ("use client" లేదు).
   PoemCard.tsx లోని "భావాలమాల" panel దీన్ని వాడుతుంది.

   జీవనచక్రం (lifecycle) — PoemCard లోని దశల పట్టీలో అదే క్రమం:
     1. createAI          → PoemAI provider (app/layout.tsx లో, అన్ని పేజీలకు ఒకటి)
     2. useUIState        → ప్రశ్న బుడగ వెంటనే తెరపై            (PoemCard)
     3. useActions        → askPoem() server action పిలుపు      (PoemCard)
     4. getMutableAIState → ఈ పద్యం చరిత్రలో ప్రశ్న చేర్చడం       (ఇక్కడ)
     5. streamUI          → Groq: మాటల జవాబు లేదా tool          (ఇక్కడ)
     6. tool (అవసరమైతే)   → పాదాలు / కఠిన పదాలు card             (ఇక్కడ)
     7. .done()           → చరిత్రలో జవాబు, AI state మూసివేత     (ఇక్కడ)
     8. useAIState        → చివరి జవాబు మాటలు → వినండి/కాపీ/వాట్సాప్ (PoemCard)

   Backend / database / Redis పిలుపులు లేవు: పద్యం మాటలు card నుంచే
   వస్తాయి, Groq ఒక్కటే బయటి పిలుపు. ఇది నేర్చుకునే దశ కోసం —
   production కి ముందు రోజువారీ పరిమితి గురించి నిర్ణయించాలి.
   ═══════════════════════════════════════════════════════════════ */

import type { ReactNode } from "react";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
  type StreamableValue,
} from "@ai-sdk/rsc";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { POEM_TOOLS, toolInfo, type PoemToolName, type SimilarPoem } from "@/app/components/poemAITools";

// "use client" ఫైల్ నుంచి వచ్చే చిన్న display components —
// server వాటిని stream చేస్తుంది, బ్రౌజర్ వాటిని చూపిస్తుంది.
import {
  PoemAIAnswer,
  PoemAIError,
  PoemAIPadalu,
  PoemAISimilar,
  PoemAIThinking,
  PoemAIToolLoading,
  PoemAIWords,
} from "@/app/components/PoemCard";

/* ------------------------------------------------------------------ */
/* Types — PoemCard కూడా ఇవే వాడుతుంది                                 */
/* ------------------------------------------------------------------ */

/** AI state లో ఒక సందేశం: Groq చదివే చరిత్ర (మాటలు మాత్రమే, బొమ్మలు కాదు). */
export type PoemAIMessage = {
  role: "user" | "assistant";
  content: string;
  /** ఈ జవాబు ఏ tool నుంచి వచ్చిందో (లేకపోతే మామూలు మాటల జవాబు) */
  tool?: PoemToolName;
};

/** AI state = ప్రతి పద్యానికి వేరే చరిత్ర (key = PoemCard లోని readingEntry.id). */
export type PoemAIState = Record<string, PoemAIMessage[]>;

export type { PoemToolName };

/** Server నుంచి PoemCard దశల పట్టీకి వచ్చే సమాచారం. */
export type PoemLifecycle =
  | { step: "aiState" }
  | { step: "streamUI" }
  | { step: "tool"; tool: PoemToolName }
  | { step: "text" }
  | { step: "done"; tool?: PoemToolName }
  | { step: "error"; message: string };

/** UI state లో ఒక సందేశం: తెరపై కనిపించే బొమ్మ. */
export type PoemUIMessage = {
  id: string;
  poemKey: string;
  role: "user" | "assistant";
  display: ReactNode;
  lifecycle?: StreamableValue<PoemLifecycle>;
};

export type AskPoemInput = {
  poemKey: string;
  question: string;
  title: string;
  content: string;
  author?: string;
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const MODEL = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
const MAX_QUESTION_CHARS = 500;
const MAX_POEM_CHARS = 4000;
const MAX_TITLE_CHARS = 200;
// Server action ప్రతిసారీ AI state మొత్తం పంపుతుంది (1MB పరిమితి) —
// కాబట్టి ఒక్కో పద్యానికి చివరి 10 సందేశాలు మాత్రమే ఉంచుతాం.
const MAX_HISTORY = 10;

// ఇలాంటి పద్యాలు: ఇప్పటికే ఉన్న database శోధన (api/main.py → BGE-M3 + pgvector).
// Groq ఖర్చు లేదు; రోజువారీ పరిమితి (300), CDN cache అక్కడే ఉన్నాయి.
// Local లో వేరే చోటు చూపాలంటే: BHAVALAMALA_SEARCH_URL=http://localhost:3000/api/search
const SEARCH_URL = process.env.BHAVALAMALA_SEARCH_URL || "https://ratnalabala.vercel.app/api/search";
const SIMILAR_SHOW = 4;          // తెరపై ఎన్ని
const SEARCH_TIMEOUT_MS = 15_000;
const SEARCH_LIMIT_MSG = "ఈరోజు శోధన పరిమితి పూర్తయింది. రేపు మళ్ళీ ప్రయత్నించండి.";
const SEARCH_FAILED_MSG = "ఇప్పుడు database లో వెతకలేకపోయాను. కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.";

const AI_UNAVAILABLE_MSG = "AI సేవ ఇప్పుడు అందుబాటులో లేదు. కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.";
const EMPTY_INPUT_MSG = "ప్రశ్న లేదా పద్యం ఖాళీగా ఉంది.";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** పాత BAML ExplainPoem prompt — అవే నియమాలు, ఇప్పుడు system prompt గా. */
function buildSystemPrompt(title: string, author: string, poem: string): string {
  return `నీవు తెలుగు పద్యాలను పిల్లలకు, సామాన్యులకు సులభంగా వివరించే ఉపాధ్యాయుడివి.
క్రింద ఇచ్చిన తెలుగు పద్యాన్ని మాత్రమే ఆధారంగా తీసుకుని వినియోగదారు ప్రశ్నలకు సమాధానం ఇవ్వు.

శీర్షిక: ${title}
కవి: ${author || "తెలియదు"}
పద్యం:
${poem}

సూచనలు:
- సులభమైన తెలుగులో గరిష్ఠం 4 చిన్న వాక్యాల్లో సమాధానం ఇవ్వు. ఒక్కో వాక్యం చిన్నగా ఉండాలి.
- అవసరమైతే పాదాల అర్థాన్ని వివరించు.
- పద్యంలో ఉన్న పాత్రలు, ఉదాహరణలు, పోలికలను సరిగ్గా వివరించు.
- భావం అడిగితే చివరి వాక్యంలో పద్యం చెప్పే నీతిని చెప్పు.
- పద్యంలో లేని విషయాలను కల్పించవద్దు.
- ఈ పద్యానికి సంబంధం లేని ప్రశ్న అయితే, "నేను ఈ పద్యం గురించి మాత్రమే చెప్పగలను" అని మర్యాదగా చెప్పు.
- Markdown గుర్తులు లేకుండా సాదా వచనంలో రాయి.

సహాయకులు (tools):
${POEM_TOOLS.map((t) => `- ${t.name}: ${t.description}`).join("\n")}`;
}

/** మోడల్ అలవాటుగా వాడే **, -, # గుర్తులు తీసేయడం (Python strip_markdown లాగే). */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1")
    .replace(/^[ \t]*[-*•][ \t]+/gm, "")
    .replace(/^#{1,6}[ \t]+/gm, "")
    .trim();
}

/** పద్యాన్ని పాదాలుగా: ఖాళీ కాని ప్రతి లైన్ ఒక పాదం. */
function splitPadalu(poem: string): string[] {
  return poem
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** database నుంచి వచ్చిన link సురక్షితమైతేనే (సైట్ పేజీ లేదా https) — javascript: లాంటివి వద్దు */
function safeLink(link: unknown): string {
  const value = String(link ?? "").trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

/** భావం పదాలతో database లో వెతకడం; ఇప్పుడు చదువుతున్న పద్యం తప్ప. */
async function searchSimilarPoems(
  query: string,
  currentTitle: string,
): Promise<{ poems: SimilarPoem[] } | { error: string }> {
  const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}&top_k=${SIMILAR_SHOW + 1}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS) });
    if (res.status === 429) return { error: SEARCH_LIMIT_MSG };
    if (!res.ok) {
      console.error("[poem-ai rsc] similar search failed", { status: res.status });
      return { error: SEARCH_FAILED_MSG };
    }
    const data = (await res.json()) as { results?: Record<string, unknown>[] };
    const poems = (data.results ?? [])
      .map((r) => ({
        title: String(r.title ?? "").trim(),
        mala: String(r.mala ?? "").trim(),
        snippet: stripMarkdown(String(r.snippet ?? "")),
        link: safeLink(r.link),
      }))
      .filter((p) => p.title && p.title !== currentTitle)
      .slice(0, SIMILAR_SHOW);
    return { poems };
  } catch (error) {
    console.error("[poem-ai rsc] similar search error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: SEARCH_FAILED_MSG };
  }
}

/* ------------------------------------------------------------------ */
/* Server action 1 — ప్రశ్న అడగడం                                      */
/* ------------------------------------------------------------------ */

async function askPoem(input: AskPoemInput): Promise<PoemUIMessage> {
  "use server";

  const lifecycle = createStreamableValue<PoemLifecycle>({ step: "aiState" });

  // ── ఇన్‌పుట్ సరిచూడటం (server action = ఎవరైనా పిలవగల POST, నమ్మకూడదు) ──
  const poemKey = String(input?.poemKey ?? "").slice(0, 300);
  const question = String(input?.question ?? "").trim().slice(0, MAX_QUESTION_CHARS);
  const poem = String(input?.content ?? "").trim().slice(0, MAX_POEM_CHARS);
  const title = String(input?.title ?? "").trim().slice(0, MAX_TITLE_CHARS);
  const author = String(input?.author ?? "").trim().slice(0, MAX_TITLE_CHARS);

  if (!poemKey || !question || !poem) {
    lifecycle.done({ step: "error", message: EMPTY_INPUT_MSG });
    return {
      id: newId(),
      poemKey,
      role: "assistant",
      display: <PoemAIError message={EMPTY_INPUT_MSG} />,
      lifecycle: lifecycle.value,
    };
  }

  // ── దశ 4: getMutableAIState — ఈ పద్యం చరిత్రలో ప్రశ్న ──
  // (return కి ముందే, function పై స్థాయిలోనే పిలవాలి — AI SDK నియమం)
  const aiState = getMutableAIState<typeof PoemAI>(poemKey);
  const history = (aiState.get() ?? []).slice(-MAX_HISTORY);
  const userMessage: PoemAIMessage = { role: "user", content: question };
  aiState.update([...history, userMessage]);

  const finish = (answer: PoemAIMessage) => {
    // ── దశ 7: .done() — జవాబుతో చరిత్ర మూసివేత ──
    aiState.done([...history, userMessage, answer].slice(-MAX_HISTORY));
  };

  try {
    // ── దశ 5: streamUI — Groq కి పద్యం + చరిత్ర + సహాయకుల జాబితా ──
    lifecycle.update({ step: "streamUI" });

    const result = await streamUI({
      model: groq(MODEL),
      system: buildSystemPrompt(title, author, poem),
      messages: [...history, userMessage].map((m) => ({ role: m.role, content: m.content })),
      initial: <PoemAIThinking />,

      // (అ) మామూలు జవాబు: మాట మాటగా
      text: ({ content, done }) => {
        const clean = stripMarkdown(content);
        if (done) {
          finish({ role: "assistant", content: clean });
          lifecycle.done({ step: "done" });
        } else {
          lifecycle.update({ step: "text" });
        }
        return <PoemAIAnswer text={clean} streaming={!done} />;
      },

      // (ఆ) సహాయకులు (tools) — Groq తనే ఎప్పుడు పిలవాలో నిర్ణయిస్తాడు
      tools: {
        showPadalu: {
          description: toolInfo("showPadalu").description,
          inputSchema: z.object({}),
          generate: async function* () {
            lifecycle.update({ step: "tool", tool: "showPadalu" });
            yield <PoemAIToolLoading label="పాదాలుగా విడదీస్తున్నాను…" />;

            const padalu = splitPadalu(poem);
            finish({ role: "assistant", content: padalu.join("\n"), tool: "showPadalu" });
            lifecycle.done({ step: "done", tool: "showPadalu" });
            return <PoemAIPadalu padalu={padalu} />;
          },
        },
        explainWords: {
          description: toolInfo("explainWords").description,
          inputSchema: z.object({
            words: z
              .array(z.object({ word: z.string().max(60), meaning: z.string().max(200) }))
              .min(1)
              .max(8),
          }),
          generate: async function* ({ words }) {
            lifecycle.update({ step: "tool", tool: "explainWords" });
            yield <PoemAIToolLoading label="కఠిన పదాలు వెతుకుతున్నాను…" />;

            const list = words.map((w) => ({ word: w.word.trim(), meaning: stripMarkdown(w.meaning) }));
            finish({
              role: "assistant",
              content: list.map((w) => `${w.word}: ${w.meaning}`).join("\n"),
              tool: "explainWords",
            });
            lifecycle.done({ step: "done", tool: "explainWords" });
            return <PoemAIWords words={list} />;
          },
        },
        // మూడో సహాయకుడు: Groq భావం పదాలు ఇస్తాడు → మన code database లో వెతుకుతుంది
        findSimilarPoems: {
          description: toolInfo("findSimilarPoems").description,
          inputSchema: z.object({
            query: z.string().min(2).max(120).describe("ఈ పద్యం ముఖ్య భావం, 2–6 తెలుగు పదాలు"),
          }),
          generate: async function* ({ query }) {
            lifecycle.update({ step: "tool", tool: "findSimilarPoems" });
            yield <PoemAIToolLoading label="database లో ఇలాంటి పద్యాలు వెతుకుతున్నాను…" />;

            const theme = query.trim();
            const found = await searchSimilarPoems(theme, title);
            if ("error" in found) {
              finish({ role: "assistant", content: found.error, tool: "findSimilarPoems" });
              lifecycle.done({ step: "done", tool: "findSimilarPoems" });
              return <PoemAIError message={found.error} />;
            }

            // AI state లో పేర్లు మాత్రమే — తర్వాతి ప్రశ్నకు Groq కి ఏం చూపించామో తెలుస్తుంది
            finish({
              role: "assistant",
              content: found.poems.length
                ? `"${theme}" భావంతో దొరికినవి:\n${found.poems.map((p) => `${p.title}${p.mala ? ` (${p.mala})` : ""}`).join("\n")}`
                : `"${theme}" భావంతో ఇంకేమీ దొరకలేదు.`,
              tool: "findSimilarPoems",
            });
            lifecycle.done({ step: "done", tool: "findSimilarPoems" });
            return <PoemAISimilar query={theme} poems={found.poems} />;
          },
        },
      },
    });

    return {
      id: newId(),
      poemKey,
      role: "assistant",
      display: result.value,
      lifecycle: lifecycle.value,
    };
  } catch (error) {
    // సందర్భంతో log — పద్యం మాటలు, keys లాగ్ చేయము
    console.error("[poem-ai rsc] askPoem failed", {
      poemKey,
      model: MODEL,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
    aiState.done(history); // విఫలమైన ప్రశ్నను చరిత్రలో ఉంచము
    lifecycle.done({ step: "error", message: AI_UNAVAILABLE_MSG });
    return {
      id: newId(),
      poemKey,
      role: "assistant",
      display: <PoemAIError message={AI_UNAVAILABLE_MSG} />,
      lifecycle: lifecycle.value,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Server action 2 — "కొత్త సంభాషణ": ఈ పద్యం చరిత్ర ఖాళీ               */
/* ------------------------------------------------------------------ */

async function resetPoemChat(poemKey: string): Promise<void> {
  "use server";
  const aiState = getMutableAIState<typeof PoemAI>(String(poemKey ?? "").slice(0, 300));
  aiState.done([]);
}

/* ------------------------------------------------------------------ */
/* దశ 1: createAI — provider (app/layout.tsx లో అన్ని పేజీలను చుడుతుంది) */
/* ------------------------------------------------------------------ */

export const PoemAI = createAI<
  PoemAIState,
  PoemUIMessage[],
  { askPoem: typeof askPoem; resetPoemChat: typeof resetPoemChat }
>({
  actions: { askPoem, resetPoemChat },
  initialAIState: {},
  initialUIState: [],
});