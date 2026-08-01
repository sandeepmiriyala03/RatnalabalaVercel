"use client";

import { useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Divider, Drawer, Paper, Stack,
  TextField, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StreamingChat from "./StreamingChat";

/* ══════════════════════════════════════════════════════════════════
   Unchanged from before — POETRY_COLLECTIONS, PoetryKey, and the
   helper functions stay exactly as they were.
══════════════════════════════════════════════════════════════════ */

export interface PoetryMeta {
  key: string;
  label: string;
  authors: string | string[];
  totalPoems?: number;
  aliases?: string[];
}

export const POETRY_COLLECTIONS = [
  {
    key: "Jandhyala",
    label: "తెలుగుబాల",
    authors: "శ్రీ జంధ్యాల పాపయ్య శాస్త్రి గారు",
    totalPoems: 100,
    aliases: ["తెలుగుబాల", "jan", "j"],
  },
  {
    key: "Sumati",
    label: "సుమతీ",
    authors: "శ్రీ బద్దెన గారు",
    totalPoems: 110,
    aliases: ["సుమతి", "సుమతీ", "sumati", "s"],
  },
  {
    key: "SriKalahastheeswara",
    label: "శ్రీకాళహస్తీశ్వర",
    authors: "శ్రీ ధూర్జటి గారు",
    totalPoems: 115,
    aliases: ["శ్రీకాళహస్తీశ్వర", "కాళహస్తీశ్వర", "kalahasti", "sk"],
  },
  {
    key: "KrishnaSatakam",
    label: "కృష్ణ",
    authors: "శ్రీ నరసింహ కవి గారు",
    totalPoems: 101,
    aliases: ["కృష్ణ", "krishna", "kr"],
  },
  {
    key: "NarayanaSatakam",
    label: "నారాయణ",
    authors: "శ్రీ బమ్మెర పోతన గారు",
    totalPoems: 105,
    aliases: ["నారాయణ", "narayana", "na"],
  },
  {
    key: "Annamacharya",
    label: "శ్రీ వేంకటేశ్వర",
    authors: "శ్రీ తాళ్లపాక అన్నమాచార్యుఁడు గారు",
    totalPoems: 91,
    aliases: ["వేంకటేశ్వర", "అన్నమాచార్య", "annamacharya", "vk"],
  },
  {
    key: "ShivanandaLahari",
    label: "శివానందలహరి",
    authors: "శ్రీ ఆది శంకరాచార్యులు గారు",
    totalPoems: 100,
    aliases: ["శివానంద", "శివానందలహరి", "shivananda", "sl"],
  },
  {
    key: "RamachandraPrabhu",
    label: "రామచంద్ర ప్రభు",
    authors: "శ్రీ కూచి నరసింహము గారు",
    totalPoems: 99,
    aliases: ["రామచంద్ర", "రామచంద్రప్రభు", "ramachandra", "rc"],
  },
  {
    key: "YajnavalkyaSatakam",
    label: "శ్రీ యాజ్ఞవల్క్య ",
    authors: "శ్రీ చింతా రామకృష్ణారావు గారు",
    totalPoems: 108,
    aliases: ["యాజ్ఞవల్క్య", "yajnavalkya", "yv"],
  },
  {
    key: "DasarathiKaruNapaYonidhi",
    label: "శ్రీ దాశరథీ కరుణాపయోనిధీ",
    authors: "శ్రీ భద్రాచల రామదాసు గారు",
    totalPoems: 115,
    aliases: ["దాశరథీ", "దశరథి", "dasarathi", "dk"],
  },
  {
    key: "TeaShatakam",
    label: "టీ శతకం",
    authors: "శ్రీ ప్రసాదరావు మిరియాల గారు",
    totalPoems: 108,
    aliases: ["టీ", "కాఫీ", "tea", "coffee", "t"],
  },
] as const satisfies readonly PoetryMeta[];

export type PoetryKey = (typeof POETRY_COLLECTIONS)[number]["key"];

export function getCollectionByKey(key: string): PoetryMeta | undefined {
  return POETRY_COLLECTIONS.find((c) => c.key === key);
}

export function getCollectionByAlias(alias: string): PoetryMeta | undefined {
  const normalized = alias.trim().toLowerCase();
  return POETRY_COLLECTIONS.find((c) => {
    if (c.key.toLowerCase() === normalized) return true;
    if (!("aliases" in c)) return false;
    return c.aliases.some((a) => a.toLowerCase() === normalized);
  });
}

export function buildAliasMap(): Record<string, PoetryKey> {
  const map: Record<string, PoetryKey> = {};
  for (const collection of POETRY_COLLECTIONS) {
    if (collection.key === "Jandhyala") continue;
    for (const alias of collection.aliases ?? []) {
      map[alias.toLowerCase()] = collection.key as PoetryKey;
    }
  }
  return map;
}

/* ══════════════════════════════════════════════════════════════════
   NEW — chat message + RAG response shapes
══════════════════════════════════════════════════════════════════ */

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface RagReply {
  answer: string;
  title: string;
  folder: string;
  content: string;
}

export default function ChatbotWindow({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // NEW — lets the user pick between the two chat implementations,
  // rather than one replacing the other. "classic" = existing
  // /api/rag_chat (Python, Cohere+Groq). "streaming" = new /api/chat
  // (native TypeScript, Vercel AI SDK, same Cohere+Groq underneath,
  // real token-by-token streaming).
  const [chatMode, setChatMode] = useState<"classic" | "streaming">("classic");

  // Existing random-pick feature — unchanged behavior.
  const [recommendation, setRecommendation] = useState<{
    title: string;
    content: string;
    folder: string;
    reason: string;
  } | null>(null);

  // NEW — free-form chat, backed by /api/rag_chat.
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [lastReply, setLastReply] = useState<RagReply | null>(null);

  const askForPoem = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agent/pick-poem");
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "సిఫార్సు అందుబాటులో లేదు.");
      setRecommendation({ title: data.poem.title, content: data.poem.content, folder: data.poem.folder, reason: data.agentReason });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "సమస్య ఏర్పడింది. మళ్లీ ప్రయత్నించండి.");
    } finally {
      setIsLoading(false);
    }
  };

  // NEW — sends the typed question to the RAG endpoint, and keeps the
  // conversation history so follow-ups ("ఇంకోటి చూపించు") have context.
  const askRag = async () => {
    if (!query.trim()) return;
    const userMessage = query.trim();

    setIsLoading(true);
    setError("");
    setQuery("");

    try {
      const response = await fetch("/api/rag_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: chatHistory }),
      });
      const data: RagReply & { error?: string } = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "జవాబు రాలేదు.");

      setLastReply(data);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: data.answer },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "సమస్య ఏర్పడింది. మళ్లీ ప్రయత్నించండి.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 380 } } }}>
      <Stack spacing={2.5} sx={{ height: "100%", p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={800}>భావాలమాల సహాయకుడు</Typography>
            <Typography variant="body2" color="text.secondary">మీ కోసం ఒక పద్యాన్ని ఎంచే సహాయకుడు</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="సహాయకుడిని మూసివేయండి"><CloseIcon /></IconButton>
        </Stack>
        <Divider />

        {/* NEW — toggle between the two chat implementations, kept as
            separate options rather than one replacing the other. */}
        <ToggleButtonGroup
          value={chatMode}
          exclusive
          size="small"
          fullWidth
          onChange={(_, val) => val && setChatMode(val)}
        >
          <ToggleButton value="classic">క్లాసిక్ చాట్</ToggleButton>
          <ToggleButton value="streaming">స్ట్రీమింగ్ చాట్ (కొత్తది)</ToggleButton>
        </ToggleButtonGroup>

        {chatMode === "classic" && (
          <>
            {/* free-form chat input, backed by Python /api/rag_chat */}
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                ఒక భావం లేదా అంశం టైప్ చేయండి — ఉదా: &ldquo;ఓర్పు గురించి పద్యం&rdquo;
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="మీ ప్రశ్న..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askRag()}
                  disabled={isLoading}
                />
                <IconButton onClick={askRag} disabled={isLoading || !query.trim()} aria-label="పంపండి" color="primary">
                  <SendRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>

            {lastReply && (
              <Paper sx={{ bgcolor: "secondary.50", border: "1px solid", borderColor: "secondary.light", borderRadius: 2, p: 2 }}>
                <Typography variant="overline" color="secondary.main">సూచించిన సేకరణ: {lastReply.folder}</Typography>
                <Typography variant="h6" fontWeight={700}>{lastReply.title}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1.5, maxHeight: 180, overflowY: "auto" }}>
                  {lastReply.content}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">{lastReply.answer}</Typography>
              </Paper>
            )}
          </>
        )}

        {chatMode === "streaming" && (
          // New — native TypeScript, Vercel AI SDK, real token-by-token
          // streaming. Same underlying Cohere+Groq, different backend
          // implementation (app/api/chat/route.ts, not Python).
          <StreamingChat />
        )}

        <Divider>లేదా</Divider>

        {/* Existing random-pick button — unchanged */}
        <Typography variant="body2" color="text.secondary">క్రింది బటన్ నొక్కితే సహాయకుడు సాహిత్య సేకరణలలో నుండి యాదృచ్ఛికంగా ఒక పద్యాన్ని ఎంచి చూపిస్తాడు.</Typography>
        <Button variant="contained" size="large" onClick={askForPoem} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}>
          {isLoading ? "పద్యాన్ని వెతుకుతోంది…" : "నాకు యాదృచ్ఛికంగా ఒక పద్యం సూచించండి"}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {recommendation && (
          <Paper sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.light", borderRadius: 2, p: 2 }}>
            <Typography variant="overline" color="primary.main">సూచించిన సేకరణ: {recommendation.folder}</Typography>
            <Typography variant="h6" fontWeight={700}>{recommendation.title}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1.5, maxHeight: 220, overflowY: "auto" }}>{recommendation.content}</Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary"><strong>ఎందుకు ఎంచింది:</strong> {recommendation.reason}</Typography>
          </Paper>
        )}

        <Box sx={{ mt: "auto" }}><Typography variant="caption" color="text.secondary">ఈ సహాయకుడు ఎడమ వైపున అన్ని పేజీలలో అందుబాటులో ఉంటుంది.</Typography></Box>
      </Stack>
    </Drawer>
  );
}