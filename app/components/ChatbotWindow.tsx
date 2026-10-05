"use client";

import { useRef, useState } from "react";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

/* ================================================================
   కవిత్వ సేకరణలు — ఇతర files వాడుతున్నాయి, మార్చకండి
================================================================ */

export interface PoetryMeta {
  key: string;
  label: string;
  authors: string | string[];
  totalPoems?: number;
  aliases?: string[];
}

export const POETRY_COLLECTIONS = [
  { key: "Jandhyala", label: "తెలుగుబాల", authors: "శ్రీ జంధ్యాల పాపయ్య శాస్త్రి గారు", totalPoems: 100, aliases: ["తెలుగుబాల", "jan", "j"] },
  { key: "Sumati", label: "సుమతీ", authors: "శ్రీ బద్దెన గారు", totalPoems: 110, aliases: ["సుమతి", "సుమతీ", "sumati", "s"] },
  { key: "SriKalahastheeswara", label: "శ్రీకాళహస్తీశ్వర", authors: "శ్రీ ధూర్జటి గారు", totalPoems: 115, aliases: ["శ్రీకాళహస్తీశ్వర", "కాళహస్తీశ్వర", "kalahasti", "sk"] },
  { key: "KrishnaSatakam", label: "కృష్ణ", authors: "శ్రీ నరసింహ కవి గారు", totalPoems: 101, aliases: ["కృష్ణ", "krishna", "kr"] },
  { key: "NarayanaSatakam", label: "నారాయణ", authors: "శ్రీ బమ్మెర పోతన గారు", totalPoems: 105, aliases: ["నారాయణ", "narayana", "na"] },
  { key: "Annamacharya", label: "శ్రీ వేంకటేశ్వర", authors: "శ్రీ తాళ్లపాక అన్నమాచార్యుఁడు గారు", totalPoems: 91, aliases: ["వేంకటేశ్వర", "అన్నమాచార్య", "annamacharya", "vk"] },
  { key: "ShivanandaLahari", label: "శివానందలహరి", authors: "శ్రీ ఆది శంకరాచార్యులు గారు", totalPoems: 100, aliases: ["శివానంద", "శివానందలహరి", "shivananda", "sl"] },
  { key: "RamachandraPrabhu", label: "రామచంద్ర ప్రభు", authors: "శ్రీ కూచి నరసింహము గారు", totalPoems: 99, aliases: ["రామచంద్ర", "రామచంద్రప్రభు", "ramachandra", "rc"] },
  { key: "YajnavalkyaSatakam", label: "శ్రీ యాజ్ఞవల్క్య", authors: "శ్రీ చింతా రామకృష్ణారావు గారు", totalPoems: 108, aliases: ["యాజ్ఞవల్క్య", "yajnavalkya", "yv"] },
  { key: "DasarathiKaruNapaYonidhi", label: "శ్రీ దాశరథీ కరుణాపయోనిధీ", authors: "శ్రీ భద్రాచల రామదాసు గారు", totalPoems: 115, aliases: ["దాశరథీ", "దశరథి", "dasarathi", "dk"] },
  { key: "TeaShatakam", label: "టీ శతకం", authors: "శ్రీ ప్రసాదరావు మిరియాల గారు", totalPoems: 108, aliases: ["టీ", "కాఫీ", "tea", "coffee", "t"] },
] as const satisfies readonly PoetryMeta[];

export type PoetryKey = (typeof POETRY_COLLECTIONS)[number]["key"];

export function getCollectionByKey(key: string): PoetryMeta | undefined {
  return POETRY_COLLECTIONS.find((c) => c.key === key);
}

export function getCollectionByAlias(alias: string): PoetryMeta | undefined {
  const normalized = alias.trim().toLowerCase();
  return POETRY_COLLECTIONS.find(
    (c) => c.key.toLowerCase() === normalized || c.aliases.some((a) => a.toLowerCase() === normalized)
  );
}

export function buildAliasMap(): Record<string, PoetryKey> {
  const map: Record<string, PoetryKey> = {};
  for (const collection of POETRY_COLLECTIONS) {
    if (collection.key === "Jandhyala") continue;
    for (const alias of collection.aliases) map[alias.toLowerCase()] = collection.key;
  }
  return map;
}

/* ================================================================
   భావాలమాల AI — RAG జవాబు రూపం
================================================================ */

interface RagSource {
  id: number;
  title: string;
  mala: string;
  link?: string;
  similarity: number;
}

interface RagReply {
  success: boolean;
  question: string;
  answer: string;
  sources: RagSource[];
  error?: string;
}

interface Recommendation {
  title: string;
  content: string;
  folder: string;
  reason: string;
}

/** ప్రశ్నకు ఆ ఆధారం ఎంత దగ్గరగా ఉందో (0–100%) — జవాబు నిజమో కాదో కొలత కాదు */
const similarityPercent = (s: number) => Math.round(Math.max(0, Math.min(1, Number(s) || 0)) * 100);

function similarityLabel(s: number): string {
  if (s >= 0.85) return "చాలా దగ్గరగా";
  if (s >= 0.7) return "దగ్గరగా";
  if (s >= 0.5) return "కొంత సంబంధం";
  return "తక్కువ సంబంధం";
}

/** Server JSON కాకుండా ఏదైనా పంపినా (500 పేజీ) విరగకుండా */
async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/* ================================================================
   CHATBOT WINDOW  (opened by the left-side "భావాలమాల AI" button
   in RootClientLayout)
================================================================ */

export default function ChatbotWindow({ open, onClose }: { open: boolean; onClose: () => void }) {
  // భావాలమాల AI
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [lastReply, setLastReply] = useState<RagReply | null>(null);
  const [ragError, setRagError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // యాదృచ్ఛిక పద్యం
  const [picking, setPicking] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [poemError, setPoemError] = useState("");

  /* ---------- భావాలమాల AI: POST /api/main?endpoint=bhavalamala-chat ---------- */
  const askRag = async () => {
    const question = query.trim();
    if (!question || asking) return;

    setAsking(true);
    setRagError("");
    try {
      const response = await fetch("/api/main?endpoint=bhavalamala-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, top_k: 5 }),
      });
      const data = await readJson<RagReply>(response);
      if (!response.ok || !data?.success) throw new Error(data?.error || "జవాబు రాలేదు. మళ్ళీ ప్రయత్నించండి.");
      setLastReply(data);
      setQuery(""); // విజయవంతమైతేనే ప్రశ్న తుడిచేయడం
    } catch (err) {
      setRagError(err instanceof Error ? err.message : "సమస్య ఏర్పడింది. మళ్లీ ప్రయత్నించండి.");
      // disabled తీసేశాక focus చేయాలి — అందుకే తర్వాతి frame లో
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setAsking(false);
    }
  };

  /* ---------- యాదృచ్ఛిక పద్యం: GET /api/agent/pick-poem ---------- */
  const askForPoem = async () => {
    setPicking(true);
    setPoemError("");
    try {
      const response = await fetch("/api/agent/pick-poem");
      const data = await readJson<{ success: boolean; error?: string; agentReason?: string; poem?: { title: string; content: string; folder: string } }>(response);
      if (!response.ok || !data?.success || !data.poem) throw new Error(data?.error || "సిఫార్సు అందుబాటులో లేదు.");
      setRecommendation({ ...data.poem, reason: data.agentReason ?? "" });
    } catch (err) {
      setPoemError(err instanceof Error ? err.message : "సమస్య ఏర్పడింది. మళ్లీ ప్రయత్నించండి.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      aria-labelledby="bhavalamala-title"
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          // clear of the iPhone notch and home bar
          pt: "env(safe-area-inset-top, 0px)",
          pb: "env(safe-area-inset-bottom, 0px)",
          bgcolor: "var(--background)",
          color: "var(--foreground)",
        },
      }}
    >
      <Stack spacing={2.5} sx={{ height: "100%", p: 2.5, overflowY: "auto" }}>
        {/* HEADER */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="bhavalamala-title" variant="h6" component="h2" fontWeight={800}>
              భావాలమాల AI
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
              భావాలమాలలో అడగండి — అర్థవంతమైన సమాధానం పొందండి
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="సహాయకుడిని మూసివేయండి" sx={{ width: 48, height: 48, flexShrink: 0 }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider />

        {/* ప్రశ్న — Enter తో పంపడం form వల్ల సహజంగా పనిచేస్తుంది */}
        <Stack
          component="form"
          spacing={1}
          aria-labelledby="bhavalamala-title"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            void askRag();
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField
              fullWidth
              label="మీ ప్రశ్న"
              placeholder="ఉదా: అసహనం గురించి ఏమి చెప్పారు?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputRef={inputRef}
              inputProps={{ maxLength: 1000 }}
              disabled={asking}
            />
            <IconButton
              type="submit"
              disabled={asking || !query.trim()}
              aria-label="ప్రశ్న పంపండి"
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: "var(--radius-sm)",
                bgcolor: "var(--secondary)",
                color: "var(--background)",
                "&:hover": { bgcolor: "var(--secondary)", filter: "brightness(1.08)" },
                "&.Mui-disabled": { bgcolor: "var(--surface)", color: "var(--muted-text)" },
              }}
            >
              {asking ? <CircularProgress size={24} sx={{ color: "inherit" }} /> : <SendRoundedIcon />}
            </IconButton>
          </Stack>
          <Typography role="status" aria-live="polite" variant="body2" sx={{ color: "var(--muted-text)", minHeight: "1.6em" }}>
            {asking ? "భావాలమాలలో వెతికి, జవాబు సిద్ధం చేస్తున్నాం…" : ""}
          </Typography>
        </Stack>

        {ragError && (
          <Alert severity="error" onClose={() => setRagError("")}>
            {ragError}
          </Alert>
        )}

        {/* జవాబు + ఆధారాలు */}
        {lastReply && (
          <Paper
            elevation={0}
            sx={(t) => ({ p: 2, borderRadius: 2, border: "1.5px solid", borderColor: "secondary.light", bgcolor: alpha(t.palette.secondary.main, 0.06) })}
          >
            <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>
              ❓ {lastReply.question}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: "var(--secondary)" }}>
              భావాలమాల AI జవాబు
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5, lineHeight: 1.9 }}>{lastReply.answer}</Typography>

            {lastReply.sources.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" fontWeight={700}>
                  🔎 వెతికిన ఆధారాలు
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
                  స్కోర్: ప్రశ్నకు ఆ సమాచారం ఎంత దగ్గరగా ఉందో సూచిస్తుంది.
                </Typography>

                <Stack component="ol" spacing={1} sx={{ mt: 1, p: 0, listStyle: "none" }}>
                  {lastReply.sources.map((source) => {
                    const score = similarityPercent(source.similarity);
                    return (
                      <Box component="li" key={source.id} sx={{ p: 1.25, border: "1px solid var(--border-strong)", borderRadius: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box sx={{ minWidth: 0 }}>
                            {source.link ? (
                              <Typography
                                component={NextLink}
                                href={source.link}
                                onClick={onClose}
                                variant="body2"
                                fontWeight={700}
                                sx={{ color: "var(--accent-text)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                              >
                                {source.title}
                              </Typography>
                            ) : (
                              <Typography variant="body2" fontWeight={700}>
                                {source.title}
                              </Typography>
                            )}
                            {source.mala && (
                              <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
                                {source.mala}
                              </Typography>
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{
                              whiteSpace: "nowrap",
                              color: score >= 85 ? "var(--success)" : score >= 70 ? "var(--primary)" : "var(--muted-text)",
                            }}
                          >
                            {score}%
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5, color: "var(--muted-text)" }}>
                          సంబంధితత: <strong>{similarityLabel(source.similarity)}</strong>
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}
          </Paper>
        )}

        <Divider>లేదా</Divider>

        {/* యాదృచ్ఛిక పద్యం */}
        <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
          క్రింది బటన్ నొక్కితే సహాయకుడు సాహిత్య సేకరణల నుండి యాదృచ్ఛికంగా ఒక పద్యాన్ని ఎంచి చూపిస్తాడు.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={askForPoem}
          disabled={picking}
          startIcon={picking ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{
            minHeight: 56,
            fontSize: "1rem",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "var(--radius-sm)",
            bgcolor: "var(--primary)",
            color: "var(--background)",
            "&:hover": { bgcolor: "var(--primary)", filter: "brightness(1.08)" },
          }}
        >
          {picking ? "పద్యాన్ని వెతుకుతోంది…" : "నాకు యాదృచ్ఛికంగా ఒక పద్యం సూచించండి"}
        </Button>

        {poemError && (
          <Alert severity="error" onClose={() => setPoemError("")}>
            {poemError}
          </Alert>
        )}

        {recommendation && (
          <Paper sx={(t) => ({ p: 2, borderRadius: 2, border: "1.5px solid", borderColor: "primary.light", bgcolor: alpha(t.palette.primary.main, 0.06) })}>
            <Typography variant="body2" fontWeight={700} sx={{ color: "var(--primary)" }}>
              సూచించిన సేకరణ: {recommendation.folder}
            </Typography>
            <Typography variant="h6" component="h3" fontWeight={700}>
              {recommendation.title}
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap", mt: 1.5, maxHeight: 260, overflowY: "auto", lineHeight: 1.9 }}>
              {recommendation.content}
            </Typography>
            {recommendation.reason && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
                  <strong>ఎందుకు ఎంచింది:</strong> {recommendation.reason}
                </Typography>
              </>
            )}
          </Paper>
        )}

        <Typography variant="body2" sx={{ color: "var(--muted-text)", mt: "auto" }}>
          ఈ సహాయకుడు ఎడమ వైపు &ldquo;AI&rdquo; బటన్‌తో అన్ని పేజీలలో అందుబాటులో ఉంటుంది.
        </Typography>
      </Stack>
    </Drawer>
  );
}