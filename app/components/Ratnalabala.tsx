"use client";

/* ═══════════════════════════════════════════════════════════════
   రత్నాలబాల – జ్ఞానమాల — ముఖ పేజీ (కొత్త రూపం, చిన్నగా)

   పై నుంచి కిందికి — ఒక్కో విభాగం ఒక్క పని:
   1. ఆకుపచ్చ బ్యాండ్: పేరు, ఒక వాక్యం, 2 పెద్ద బటన్లు, లెక్కలు, సోమన పద్యం
   2. "ఏం చేయాలనుకుంటున్నారు?" — 5 పెద్ద టైల్స్ (బ్యాండ్ పైకి తేలుతూ)
   3. ఈ రోజు పద్యం  +  స్వరమాల రేడియో (పక్కపక్కనే)
   4. మా కవులు (page.tsx నుంచి వచ్చే poets — రెండు కార్డులు)
   5. మాలలు — 4 ట్యాబ్‌లు (22 మాలలు ఒకేసారి కాకుండా గుంపుల వారీగా)
   6. శైలిమాల పట్టీ: Android యాప్, రింగ్‌టోన్లు, ఫాంట్లు
   7. ప్రాజెక్ట్ గురించి — మడిచి కింద (సాంకేతికత, కృతజ్ఞతలు, స్వరాలు)

   • 60+ పాఠకుల కోసం: అక్షరాలు ≥ 1rem, నొక్కే చోటు ≥ 48px, AAA రంగులు,
     కదిలే animations లేవు; dark mode site tokens తో ఆటోమేటిక్
   • ఫాంట్ ఇక్కడ పెట్టలేదు — సైట్ ఫాంట్ (lib/teluguFonts) నే వాడుతుంది
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Collapse, Container, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import DownloadAllPosters from "../components/DownloadAllPosters";
import DownloadAllVoices from "../components/DownloadAllVoices";
import PoemRadio from "../components/Poemradio";
import DownloadAllVideos from "../components/DownloadAllVideos";

import MenuBookTwoToneIcon from "@mui/icons-material/MenuBookTwoTone";
import SpellcheckTwoToneIcon from "@mui/icons-material/SpellcheckTwoTone";
import PaletteTwoToneIcon from "@mui/icons-material/PaletteTwoTone";
import LocalLibraryTwoToneIcon from "@mui/icons-material/LocalLibraryTwoTone";
import AutoStoriesTwoToneIcon from "@mui/icons-material/AutoStoriesTwoTone";
import SelfImprovementTwoToneIcon from "@mui/icons-material/SelfImprovementTwoTone";
import ImportContactsTwoToneIcon from "@mui/icons-material/ImportContactsTwoTone";
import HistoryEduTwoToneIcon from "@mui/icons-material/HistoryEduTwoTone";
import ChromeReaderModeTwoToneIcon from "@mui/icons-material/ChromeReaderModeTwoTone";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
import BookmarkTwoToneIcon from "@mui/icons-material/BookmarkTwoTone";
import AbcTwoToneIcon from "@mui/icons-material/AbcTwoTone";
import GraphicEqTwoToneIcon from "@mui/icons-material/GraphicEqTwoTone";
import TextFieldsTwoToneIcon from "@mui/icons-material/TextFieldsTwoTone";
import FormatQuoteTwoToneIcon from "@mui/icons-material/FormatQuoteTwoTone";
import JoinFullTwoToneIcon from "@mui/icons-material/JoinFullTwoTone";
import CallMergeTwoToneIcon from "@mui/icons-material/CallMergeTwoTone";
import ImageTwoToneIcon from "@mui/icons-material/ImageTwoTone";
import MicTwoToneIcon from "@mui/icons-material/MicTwoTone";
import TranslateTwoToneIcon from "@mui/icons-material/TranslateTwoTone";
import FontDownloadTwoToneIcon from "@mui/icons-material/FontDownloadTwoTone";
import VpnKeyTwoToneIcon from "@mui/icons-material/VpnKeyTwoTone";
import StyleTwoToneIcon from "@mui/icons-material/StyleTwoTone";
import NewspaperTwoToneIcon from "@mui/icons-material/NewspaperTwoTone";
import TempleHinduTwoToneIcon from "@mui/icons-material/TempleHinduTwoTone";
import QuizTwoToneIcon from "@mui/icons-material/QuizTwoTone";
import HeadphonesTwoToneIcon from "@mui/icons-material/HeadphonesTwoTone";
import BrushTwoToneIcon from "@mui/icons-material/BrushTwoTone";
import SchoolTwoToneIcon from "@mui/icons-material/SchoolTwoTone";
import ForumTwoToneIcon from "@mui/icons-material/ForumTwoTone";
import LockTwoToneIcon from "@mui/icons-material/LockTwoTone";
import VolunteerActivismTwoToneIcon from "@mui/icons-material/VolunteerActivismTwoTone";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import GridViewTwoToneIcon from "@mui/icons-material/GridViewTwoTone";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PhoneAndroidTwoToneIcon from "@mui/icons-material/PhoneAndroidTwoTone";
import type { SvgIconComponent } from "@mui/icons-material";

/* ─── site tokens (globals.css) — dark mode ఆటోమేటిక్ ─── */
const INK = "var(--foreground)";
const PAPER = "var(--background)";
const MAROON = "var(--primary)";
const GREEN = "var(--secondary)";
const GOLD_LIGHT = "var(--accent-light)"; // ఆకుపచ్చ పై బంగారు అక్షరం
const GOLD_TEXT = "var(--accent-text)"; // తెలుపు నేపథ్యంపై బంగారు అక్షరం
const MUTED = "var(--muted-text)";
const CARD_BG = "var(--surface-elevated)";
const SURFACE = "var(--surface)";
const BORDER_STRONG = "var(--border-strong)";
const FOCUS = { "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: "3px" } };
const SHADOW = "0 6px 24px color-mix(in srgb, var(--foreground) 10%, transparent)";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const POETRY_NAME = "రత్నాలబాల – జ్ఞానమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";

type Item = { label: string; path: string; intro: string; Icon: SvgIconComponent };
type Group = { label: string; Icon: SvgIconComponent; color: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "సాహిత్యం",
    Icon: MenuBookTwoToneIcon,
    color: MAROON,
    items: [
      { label: "పద్యాలమాల", path: "/poems", intro: "మిరియాల వెంకటరత్నం గారి పద్యాలు", Icon: AutoStoriesTwoToneIcon },
      { label: "మిరా", path: "/mirapoems", intro: "డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారి పద్యాలు", Icon: SelfImprovementTwoToneIcon },
      { label: "శతకాలమాల", path: "/shatakamu", intro: "ప్రసిద్ధ తెలుగు శతకాల సేకరణ", Icon: ImportContactsTwoToneIcon },
      { label: "స్మృతిమాల", path: "/smruthimala", intro: "జ్ఞాపకాలు, స్మారక పద్యాల సంకలనం", Icon: HistoryEduTwoToneIcon },
      { label: "కథామాల", path: "/kathamala", intro: "నీతికథలు, చిన్న కథల డిజిటల్ సంగ్రహం", Icon: ChromeReaderModeTwoToneIcon },
      { label: "పరాభవమాల", path: "/parabhava", intro: "ఉగాది శతకం: పరాభవ నామ సంవత్సర స్వాగతం", Icon: WbSunnyTwoToneIcon },
      { label: "నా చదువు", path: "/my-reading", intro: "మీరు చదివినవి, ఇష్టమైనవి ఒకే చోట", Icon: BookmarkTwoToneIcon },
    ],
  },
  {
    label: "వ్యాకరణం",
    Icon: SpellcheckTwoToneIcon,
    color: GREEN,
    items: [
      { label: "అక్షరమాల", path: "/aksharamala", intro: "తెలుగు అక్షరాల అభ్యాసం, అన్వేషణ", Icon: AbcTwoToneIcon },
      { label: "గుణింతమాల", path: "/guninta", intro: "34 వ్యంజనాలు, ప్రతి అక్షరానికి 16 గుణింత రూపాలు", Icon: GraphicEqTwoToneIcon },
      { label: "పదాలమాల", path: "/padalamala", intro: "తెలుగు అక్షరాలతో కూడిన పదాలు — వినవచ్చు", Icon: TextFieldsTwoToneIcon },
      { label: "సామెతలమాల", path: "/sametalu", intro: "తెలుగు సామెతలు", Icon: FormatQuoteTwoToneIcon },
      { label: "సంధిమాల", path: "/sandhi", intro: "తెలుగు సంధుల అన్వేషణ, అభ్యాసం", Icon: JoinFullTwoToneIcon },
      { label: "సమాసముమాల", path: "/samasa", intro: "తెలుగు సమాసాల అభ్యాసం, అన్వేషణ", Icon: CallMergeTwoToneIcon },
    ],
  },
  {
    label: "కళలు",
    Icon: PaletteTwoToneIcon,
    color: MAROON,
    items: [
      { label: "చిత్రమాల", path: "/chitramala", intro: "పద్యాలను చిత్రాలుగా, పోస్టర్లుగా మార్చండి", Icon: ImageTwoToneIcon },
      { label: "స్వరమాల", path: "/swaramala", intro: "చదవండి, వినండి — తెలుగు స్వరాల అనుభవం", Icon: MicTwoToneIcon },
      { label: "లిపిమాల", path: "/lipimala", intro: "తెలుగు లిపుల పరిచయం, OCR తో రూపాంతరం", Icon: TranslateTwoToneIcon },
      { label: "ఖతిమాల", path: "/khatiMala", intro: "50+ ఫాంట్లతో రాసి PDF, పోస్టర్, వీడియో", Icon: FontDownloadTwoToneIcon },
      { label: "విదురమాల", path: "/rahasyabhasha", intro: "రహస్య భాష శైలుల అన్వేషణ, అభ్యాసం", Icon: VpnKeyTwoToneIcon },
      { label: "శైలిమాల", path: "/shailimala", intro: "ఫాంట్లు, పుస్తకాలు, యాప్, రింగ్‌టోన్లు — ఉచితం", Icon: StyleTwoToneIcon },
    ],
  },
  {
    label: "ఇంకా",
    Icon: LocalLibraryTwoToneIcon,
    color: GREEN,
    items: [
      { label: "వాచకమాల", path: "/news", intro: "తెలుగు వార్తలు చదవండి, వినండి", Icon: NewspaperTwoToneIcon },
      { label: "గీతామాల", path: "/geeta", intro: "భగవద్గీత శ్లోకాలు", Icon: TempleHinduTwoToneIcon },
      { label: "PDF ప్రశ్నోత్తరి", path: "/prashnottari", intro: "మీ తెలుగు PDF పై ప్రశ్నలు అడగండి", Icon: QuizTwoToneIcon },
    ],
  },
];
const MALA_COUNT = GROUPS.reduce((n, g) => n + g.items.length, 0);

/* ─── 5 పెద్ద టైల్స్ ─── */
const DO_HERE: { title: string; text: string; path: string; Icon: SvgIconComponent; color: string }[] = [
  { title: "చదవండి", text: "పద్యాలు, శతకాలు, కథలు", path: "/poems", Icon: AutoStoriesTwoToneIcon, color: MAROON },
  { title: "వినండి", text: "మగ, స్త్రీ స్వరాల్లో", path: "/swaramala", Icon: HeadphonesTwoToneIcon, color: GREEN },
  { title: "నేర్చుకోండి", text: "అక్షరాలు, గుణింతాలు, సంధులు", path: "/aksharamala", Icon: SchoolTwoToneIcon, color: MAROON },
  { title: "సృష్టించండి", text: "పోస్టర్, వీడియో, PDF", path: "/khatiMala", Icon: BrushTwoToneIcon, color: GREEN },
  { title: "అడగండి", text: "మీ PDF పై ప్రశ్నలు", path: "/prashnottari", Icon: ForumTwoToneIcon, color: MAROON },
];

const HERO_STATS: [string, string][] = [
  ["1,280+", "పద్యాలు"],
  ["130", "కథలు"],
  [String(MALA_COUNT), "మాలలు"],
  ["50+", "ఫాంట్లు"],
];

/* "ప్రాజెక్ట్ గురించి" లోపల */
const FEEDBACK_URL = "https://forms.gle/z4zugcnmZrW9d9cR9";

const STATS: [string, string][] = [
  ["1,280+", "మొత్తం పద్యాలు"],
  ["1037", "శతక పద్యాలు (10 శతకాలు)"],
  ["130", "కథలు"],
  ["108", "పరాభవమాల పద్యాలు"],
  ["34", "రత్నాలబాల పద్యాలు"],
  ["3", "మిరా పద్యాలు"],
  ["145", "తెలుగు పదాలు"],
  ["26", "సంధులు"],
  ["1140+", "AI పద్య విశ్లేషణలు"],
];

const PROMISES: { title: string; text: string; Icon: SvgIconComponent }[] = [
  { title: "ఉచితం", text: "వాణిజ్యేతర ప్రాజెక్ట్. చదవడానికి, వినడానికి డబ్బు లేదు.", Icon: VolunteerActivismTwoToneIcon },
  { title: "మీ గోప్యత", text: "మీరు చేర్చిన ఫాంట్లు మీ పరికరంలోనే ఉంటాయి. PDF ఫైల్ సేవ్ కాదు, దాని పాఠ్యం 24 గంటల్లో తొలగిపోతుంది.", Icon: LockTwoToneIcon },
];

const TECH: { group: string; items: { name: string; does: string }[] }[] = [
  {
    group: "మీరు చూసేది, వాడేది",
    items: [
      { name: "Next.js · React", does: "వెబ్‌సైట్ పునాది — పేజీలు వేగంగా తెరుచుకోవడానికి" },
      { name: "MUI", does: "బటన్లు, మెనూలు, కార్డులు — పెద్ద అక్షరాలు, స్పష్టమైన రంగులతో" },
      { name: "TypeScript", does: "code లో తప్పులను ముందే పట్టుకుంటుంది, site స్థిరంగా ఉంటుంది" },
      { name: "PWA (Serwist)", does: "phone లో app లా install చేసుకోవచ్చు; internet లేకపోయినా తెరుచుకుంటుంది" },
      { name: "Telugu Fonts API", does: "50+ తెలుగు ఫాంట్లు, మీ సొంత ఫాంట్ కూడా చేర్చుకోవచ్చు" },
    ],
  },
  {
    group: "వినడం, చదవడం",
    items: [
      { name: "Microsoft Edge స్వరాలు", does: "మగ (Mohan), స్త్రీ (Shruti) తెలుగు స్వరాల్లో పద్యాలు చదివి వినిపిస్తాయి" },
      { name: "Google TTS · Svara", does: "ఇంకో రెండు తెలుగు స్వరాలు — నచ్చిన స్వరం ఎంచుకోవచ్చు" },
      { name: "OCR (Tesseract)", does: "చిత్రంలోని తెలుగు అక్షరాలను పాఠ్యంగా మారుస్తుంది (లిపిమాల)" },
      { name: "Rust · WebAssembly", does: "తెలుగు అక్షర విశ్లేషణ — మీ browser లోనే, వేగంగా" },
    ],
  },
  {
    group: "AI, వెతకడం",
    items: [
      { name: "Python (Vercel)", does: "site వెనుక సర్వర్ — పద్యాలు, స్వరాలు, PDF పనులు" },
      { name: "Neon PostgreSQL · pgvector", does: "పద్యాలు, అర్థాల డేటాబేస్ — అర్థం ద్వారా పద్యాలు వెతకడం" },
      { name: "LangGraph · BAML · Groq", does: "భావాలమాల AI — పద్యాల అర్థం, సామెతలు, చదవడానికి సూచనలు" },
      { name: "సొంత RAG", does: "PDF ప్రశ్నోత్తరి — బయటి AI కి పంపకుండా, మీ PDF నుండే జవాబు" },
      { name: "WebMCP", does: "AI సహాయకులు కూడా ఈ site లో నేరుగా వెతకగలిగే కొత్త web ప్రమాణం" },
    ],
  },
  {
    group: "నడిచే చోటు",
    items: [
      { name: "Vercel", does: "site ఎప్పుడూ అందుబాటులో, ప్రపంచమంతా వేగంగా" },
      { name: "Vercel Analytics · Google Analytics", does: "ఎంతమంది, ఏ పేజీలు చదువుతున్నారో — site ను మెరుగుపరచడానికి" },
    ],
  },
];

const sectionTitle = { fontWeight: 800, fontSize: "1.15rem", mb: 1.25, mt: 3.5, "&:first-of-type": { mt: 0 } } as const;

/* ─── చిన్న భాగాలు ─── */

function SectionHeading({ id, kicker, children }: { id: string; kicker?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ textAlign: "center", mb: 3 }}>
      {kicker && (
        <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: GOLD_TEXT, letterSpacing: "0.02em", mb: 0.5 }}>{kicker}</Typography>
      )}
      <Typography id={id} component="h2" sx={{ fontWeight: 800, fontSize: { xs: "1.55rem", md: "1.8rem" }, lineHeight: 1.4 }}>
        {children}
      </Typography>
      <Box aria-hidden sx={{ display: "flex", justifyContent: "center", gap: 0.75, mt: 1.25 }}>
        {[MAROON, GOLD_TEXT, GREEN].map((c) => (
          <Box key={c} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c }} />
        ))}
      </Box>
    </Box>
  );
}

function ToggleButton({ open, onClick, icon, children, color = MAROON }: { open: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode; color?: string }) {
  return (
    <Button
      onClick={onClick}
      aria-expanded={open}
      startIcon={icon}
      endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
      sx={{ minHeight: 52, px: 2.5, textTransform: "none", fontWeight: 800, fontSize: "1.05rem", color, borderRadius: "999px", border: `1.5px solid ${BORDER_STRONG}`, ...FOCUS }}
    >
      {children}
    </Button>
  );
}

const card = { p: { xs: 2.25, sm: 3 }, borderRadius: "var(--radius)", border: `1.5px solid ${BORDER_STRONG}`, bgcolor: CARD_BG, boxShadow: SHADOW } as const;

/* ═══════════════════════════════════════════════════════════════ */

export default function RatnalabalaHighlights({ poets }: { poets?: React.ReactNode }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState(0); // ఈ రోజు పద్యం
  const [group, setGroup] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/poems");
        if (!res.ok) throw new Error(String(res.status));
        const data: Record<string, string> = await res.json();
        const list = Object.entries(data).map(([title, content]) => ({ title, content, slug: title }));
        if (!alive) return;
        setPoems(list);
        // రోజుకొక పద్యం — సంవత్సరంలో ఎన్నో రోజో దాని ప్రకారం (అందరికీ ఒకటే)
        const now = new Date();
        const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
        if (list.length) setPick(day % list.length);
      } catch {
        if (alive) setError("పద్యాలు లోడ్ కాలేదు. ఇంటర్నెట్ చూసి పేజీని మళ్ళీ తెరవండి.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const today = poems[pick];
  const g = GROUPS[group];

  return (
    <Box sx={{ bgcolor: PAPER, color: INK }}>
      {/* ═══════════ 1. పైభాగం ═══════════ */}
      <Box
        component="header"
        sx={{
          bgcolor: GREEN,
          color: PAPER,
          pt: { xs: 5, md: 8 },
          pb: { xs: 8, md: 11 },
          px: 2,
          // నిశ్చల చుక్కల అలంకరణ (కదలదు)
          backgroundImage: "radial-gradient(color-mix(in srgb, var(--background) 13%, transparent) 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
            {/* left: name + CTAs */}
            <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: GOLD_LIGHT, mb: 1 }}>🪔 ఉచిత తెలుగు సాహిత్య వేదిక</Typography>
              <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.6rem", sm: "3.2rem", md: "3.6rem" }, lineHeight: 1.25 }}>
                రత్నాలబాల
                <Box component="span" sx={{ display: "block", color: GOLD_LIGHT, fontSize: "0.55em", mt: 0.5 }}>
                  జ్ఞానమాల
                </Box>
              </Typography>
              <Typography sx={{ fontSize: { xs: "1.15rem", md: "1.3rem" }, lineHeight: 1.8, mt: 2, maxWidth: "28em", mx: { xs: "auto", md: 0 } }}>
                తెలుగు పద్యం, కథ, వ్యాకరణం — <strong>చదవండి · వినండి · నేర్చుకోండి</strong>. పెద్ద అక్షరాలతో, అందరికీ సులభంగా.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5, justifyContent: { xs: "center", md: "flex-start" } }}>
                <Button
                  component={Link}
                  href="/poems"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    minHeight: 58,
                    px: 3.5,
                    borderRadius: "999px",
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    bgcolor: PAPER,
                    color: GREEN,
                    "&:hover": { bgcolor: PAPER, filter: "brightness(0.96)" },
                    "&:focus-visible": { outline: `3px solid ${GOLD_LIGHT}`, outlineOffset: "3px" },
                  }}
                >
                  📖 పద్యాలు చదవండి
                </Button>
                <Button
                  component="a"
                  href="#radio"
                  sx={{
                    minHeight: 58,
                    px: 3.5,
                    borderRadius: "999px",
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: PAPER,
                    border: `2px solid ${PAPER}`,
                    "&:hover": { bgcolor: "color-mix(in srgb, var(--background) 12%, transparent)" },
                    "&:focus-visible": { outline: `3px solid ${GOLD_LIGHT}`, outlineOffset: "3px" },
                  }}
                >
                  🎧 వినండి
                </Button>
              </Stack>

              {/* counts */}
              <Box component="ul" aria-label="ఇక్కడ ఉన్నవి" sx={{ listStyle: "none", p: 0, m: 0, mt: 3.5, display: "flex", flexWrap: "wrap", gap: { xs: 2.5, sm: 4 }, justifyContent: { xs: "center", md: "flex-start" } }}>
                {HERO_STATS.map(([n, l]) => (
                  <Box component="li" key={l}>
                    <Box sx={{ fontWeight: 800, fontSize: "1.7rem", lineHeight: 1.2, color: GOLD_LIGHT, fontVariantNumeric: "tabular-nums" }}>{n}</Box>
                    <Box sx={{ fontSize: "1rem", fontWeight: 700 }}>{l}</Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* right: Somana poem in a frame */}
            <Box
              component="figure"
              sx={{
                m: 0,
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: "var(--radius)",
                border: `2px solid ${GOLD_LIGHT}`,
                bgcolor: "color-mix(in srgb, var(--background) 9%, transparent)",
                textAlign: "center",
                position: "relative",
              }}
            >
              <Box aria-hidden sx={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", px: 1.5, bgcolor: GREEN, fontSize: 30, lineHeight: 1.4 }}>
                ❝
              </Box>
              <Typography component="blockquote" sx={{ m: 0, fontSize: { xs: "1.05rem", md: "1.15rem" }, lineHeight: 2.05, whiteSpace: "pre-line" }}>
                {`అమిత యశస్క ఆద్యయన ఇద్రుచి ఈశ్వర ఉగ్ర ఊర్జిత
క్రమ ఋషభాంక ౠజిహర ఌస్తిత ౡస్మిత ఏకరుద్ర ఐం
ద్రమహిత రూప ఓమితి పదద్యుతి ఔర్వ లలాట అంబికా
సమరసభావ అఃకలిత వర్ణనుతం బసవేశ పాహిమాం!!`}
              </Typography>
              <Typography component="figcaption" sx={{ fontSize: "1.02rem", fontWeight: 800, mt: 1.5, color: GOLD_LIGHT }}>
                — పాల్కురికి సోమన
              </Typography>
              <Typography sx={{ fontSize: "1rem", mt: 0.5 }}>తెలుగు అక్షరమాల అంతా ఒకే పద్యంలో</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 2. 5 టైల్స్ — బ్యాండ్ పైకి తేలుతూ ═══════════ */}
      <Container maxWidth="lg" sx={{ position: "relative", mt: { xs: -5, md: -7 } }}>
        <Box component="nav" aria-label="ఏం చేయాలనుకుంటున్నారు?">
          <Box
            component="ul"
            sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: { xs: 1.25, md: 2 } }}
          >
            {DO_HERE.map(({ title, text, path, Icon, color }, i) => (
              <Box component="li" key={title} sx={{ gridColumn: { xs: i === 4 ? "1 / -1" : "auto", sm: "auto" } }}>
                <Box
                  component={Link}
                  href={path}
                  sx={{
                    height: "100%",
                    boxSizing: "border-box",
                    minHeight: 132,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 0.75,
                    p: 2,
                    borderRadius: "var(--radius)",
                    bgcolor: CARD_BG,
                    color: INK,
                    textDecoration: "none",
                    border: `1.5px solid ${BORDER_STRONG}`,
                    borderBottom: `4px solid ${color}`,
                    boxShadow: SHADOW,
                    "&:hover": { bgcolor: SURFACE },
                    "&:hover .tile-icon": { bgcolor: color, color: PAPER },
                    ...FOCUS,
                  }}
                >
                  <Box className="tile-icon" aria-hidden sx={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: SURFACE, color, border: `2px solid ${color}` }}>
                    <Icon sx={{ fontSize: "1.8rem" }} />
                  </Box>
                  <Box sx={{ fontWeight: 800, fontSize: "1.2rem" }}>{title}</Box>
                  <Box sx={{ fontSize: "1rem", color: MUTED, lineHeight: 1.5 }}>{text}</Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        {/* ═══════════ 3. ఈ రోజు పద్యం + రేడియో ═══════════ */}
        <Box component="section" aria-label="ఈ రోజు పద్యం, స్వరమాల రేడియో" sx={{ mb: { xs: 6, md: 8 } }}>
          {loading && (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }} role="status">
              <CircularProgress size={32} sx={{ color: MAROON }} />
              <Typography sx={{ fontSize: "1.05rem", color: MUTED }}>పద్యాలు లోడ్ అవుతున్నాయి…</Typography>
            </Stack>
          )}

          {error && (
            <Typography role="alert" align="center" sx={{ py: 3, fontSize: "1.05rem", color: "var(--error)" }}>
              {error}
            </Typography>
          )}

          {!loading && !error && poems.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2.5, md: 3 }, alignItems: "stretch" }}>
              {/* ఈ రోజు పద్యం */}
              <Box component="article" aria-labelledby="today-title" sx={{ ...card, borderTop: `5px solid ${MAROON}`, display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: MAROON }}>🌅 ఈ రోజు పద్యం</Typography>
                <Typography id="today-title" component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", mt: 0.5, mb: 1.5 }}>
                  {today?.title}
                </Typography>
                <Typography aria-live="polite" sx={{ fontSize: "1.15rem", lineHeight: 2, whiteSpace: "pre-line", flex: 1 }}>
                  {today?.content}
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: MUTED, mt: 1.5 }}>— మిరియాల వెంకటరత్నం, రత్నాలబాల</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2.5 }}>
                  <Button
                    onClick={() => setPick((p) => (p + 1) % poems.length)}
                    startIcon={<AutorenewRoundedIcon />}
                    sx={{ minHeight: 52, px: 2.5, borderRadius: "999px", textTransform: "none", fontWeight: 800, fontSize: "1.05rem", color: MAROON, border: `1.5px solid ${MAROON}`, ...FOCUS }}
                  >
                    మరో పద్యం
                  </Button>
                  <Button
                    component={Link}
                    href="/poems"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      minHeight: 52,
                      px: 2.5,
                      borderRadius: "999px",
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      bgcolor: MAROON,
                      color: PAPER,
                      "&:hover": { bgcolor: MAROON, filter: "brightness(1.1)" },
                      ...FOCUS,
                    }}
                  >
                    అన్ని {poems.length} పద్యాలు
                  </Button>
                </Stack>
              </Box>

              {/* రేడియో */}
              <Box id="radio" component="section" aria-labelledby="radio-title" sx={{ ...card, borderTop: `5px solid ${GREEN}`, textAlign: "center", scrollMarginTop: 96 }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: GREEN }}>🎧 స్వరమాల రేడియో</Typography>
                <Typography id="radio-title" component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", mt: 0.5, mb: 0.5 }}>
                  కళ్ళు మూసుకుని వినండి
                </Typography>
                <Typography sx={{ fontSize: "1.05rem", color: MUTED, mb: 2 }}>స్వరం ఎంచుకుంటే {poems.length} పద్యాలు వరుసగా వినిపిస్తాయి.</Typography>

                <PoemRadio poems={poems} />

                <Box sx={{ mt: 2.5 }}>
                  <ToggleButton open={toolsOpen} onClick={() => setToolsOpen((v) => !v)} icon={<DownloadForOfflineRoundedIcon />} color={GREEN}>
                    పోస్టర్లు, వీడియోలు, వాయిస్‌లు
                  </ToggleButton>
                </Box>
                <Collapse in={toolsOpen} timeout={200} unmountOnExit>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <DownloadAllPosters poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                    <DownloadAllVideos poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                    <DownloadAllVoices poems={poems} />
                  </Stack>
                </Collapse>
              </Box>
            </Box>
          )}
        </Box>

        {/* ═══════════ 4. మా కవులు ═══════════ */}
        {poets && (
          <Box component="section" aria-labelledby="poets-title" sx={{ mb: { xs: 6, md: 8 } }}>
            <SectionHeading id="poets-title" kicker="ఈ వేదిక వెనుక">
              మా కవులు
            </SectionHeading>
            {poets}
          </Box>
        )}

        {/* ═══════════ 5. మాలలు — 4 ట్యాబ్‌లు ═══════════ */}
        <Box component="section" aria-labelledby="malas-title" sx={{ mb: { xs: 6, md: 8 } }}>
          <SectionHeading id="malas-title" kicker={`${MALA_COUNT} మాలలు, 4 గుంపులు`}>
            మాలలు అన్వేషించండి
          </SectionHeading>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Tabs
              value={group}
              onChange={(_, v: number) => setGroup(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="మాలల గుంపులు"
              sx={{
                minHeight: 0,
                p: 0.75,
                borderRadius: "999px",
                bgcolor: SURFACE,
                border: `1.5px solid ${BORDER_STRONG}`,
                maxWidth: "100%",
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": { minHeight: 52, borderRadius: "999px", textTransform: "none", fontWeight: 800, fontSize: "1.05rem", color: INK, px: 2.25, ...FOCUS },
                "& .MuiTab-root.Mui-selected": { bgcolor: g.color, color: PAPER },
              }}
            >
              {GROUPS.map((gr, i) => (
                <Tab
                  key={gr.label}
                  id={`mala-tab-${i}`}
                  aria-controls="mala-panel"
                  icon={<gr.Icon sx={{ fontSize: "1.35rem" }} />}
                  iconPosition="start"
                  label={`${gr.label} (${gr.items.length})`}
                />
              ))}
            </Tabs>
          </Box>

          <Box
            id="mala-panel"
            role="tabpanel"
            aria-labelledby={`mala-tab-${group}`}
            component="ul"
            sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.75 }}
          >
            {g.items.map((item) => (
              <li key={item.path}>
                <Box
                  component={Link}
                  href={item.path}
                  sx={{
                    height: "100%",
                    boxSizing: "border-box",
                    minHeight: 84,
                    textDecoration: "none",
                    color: INK,
                    display: "flex",
                    gap: 1.75,
                    alignItems: "center",
                    borderRadius: "var(--radius)",
                    p: 2,
                    bgcolor: CARD_BG,
                    border: `1.5px solid ${BORDER_STRONG}`,
                    "&:hover": { bgcolor: SURFACE, borderColor: g.color },
                    "&:hover .go": { color: g.color },
                    ...FOCUS,
                  }}
                >
                  <Box aria-hidden sx={{ width: 52, height: 52, flexShrink: 0, borderRadius: "14px", display: "grid", placeItems: "center", bgcolor: `color-mix(in srgb, ${g.color} 12%, ${PAPER})`, color: g.color }}>
                    <item.Icon sx={{ fontSize: "1.75rem" }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.5 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: "1rem", color: MUTED, lineHeight: 1.55 }}>{item.intro}</Typography>
                  </Box>
                  <ArrowForwardRoundedIcon className="go" aria-hidden sx={{ color: MUTED, flexShrink: 0 }} />
                </Box>
              </li>
            ))}
          </Box>
        </Box>

        {/* ═══════════ 6. శైలిమాల పట్టీ — యాప్, రింగ్‌టోన్లు ═══════════ */}
        <Box
          component="aside"
          aria-label="ఉచిత డౌన్‌లోడ్లు"
          sx={{
            mb: { xs: 6, md: 8 },
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "var(--radius)",
            bgcolor: MAROON,
            color: PAPER,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: { xs: 2, sm: 3 },
            textAlign: { xs: "center", sm: "left" },
            backgroundImage: "radial-gradient(color-mix(in srgb, var(--background) 12%, transparent) 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px",
          }}
        >
          <PhoneAndroidTwoToneIcon aria-hidden sx={{ fontSize: "3.5rem", color: GOLD_LIGHT }} />
          <Box sx={{ flex: 1 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.35rem" }}>
              ఫోన్‌లో యాప్‌గా · రింగ్‌టోన్లు · 50+ ఫాంట్లు
            </Typography>
            <Typography sx={{ fontSize: "1.05rem", lineHeight: 1.8, mt: 0.5 }}>మా Android యాప్, AI పాటల రింగ్‌టోన్లు, తెలుగు ఫాంట్లు, పుస్తకాలు — అన్నీ ఉచితం.</Typography>
          </Box>
          <Button
            component={Link}
            href="/shailimala#apk"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              minHeight: 56,
              px: 3,
              flexShrink: 0,
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "1.1rem",
              bgcolor: PAPER,
              color: MAROON,
              width: { xs: "100%", sm: "auto" },
              "&:hover": { bgcolor: PAPER, filter: "brightness(0.96)" },
              "&:focus-visible": { outline: `3px solid ${GOLD_LIGHT}`, outlineOffset: "3px" },
            }}
          >
            శైలిమాల తెరవండి
          </Button>
        </Box>

        {/* ═══════════ 7. ప్రాజెక్ట్ గురించి — మడిచి ═══════════ */}
        <Box component="section" aria-label="ప్రాజెక్ట్ గురించి" sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "1.1rem", lineHeight: 1.9, maxWidth: "36em", mx: "auto", mb: 2 }}>
            తెలుగు పద్యాలు, కథలు పుస్తకాల్లో, జ్ఞాపకాల్లో మాత్రమే ఉండిపోకూడదు — తర్వాతి తరాలకు అందించడానికే ఈ ఉచిత, వాణిజ్యేతర వేదిక.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" alignItems="center">
            <ToggleButton open={aboutOpen} onClick={() => setAboutOpen((v) => !v)}>
              {aboutOpen ? "తక్కువగా చూపించు" : "ప్రాజెక్ట్ గురించి పూర్తిగా"}
            </ToggleButton>
            <Button
              component="a"
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<ChatBubbleOutlineRoundedIcon />}
              sx={{ minHeight: 52, px: 2.5, textTransform: "none", fontWeight: 800, fontSize: "1.05rem", borderRadius: "999px", bgcolor: GREEN, color: PAPER, "&:hover": { bgcolor: GREEN, filter: "brightness(1.1)" }, ...FOCUS }}
            >
              అభిప్రాయం చెప్పండి
              <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                {" "}
                (కొత్త ట్యాబ్‌లో)
              </Box>
            </Button>
          </Stack>

          <Collapse in={aboutOpen} timeout={200} unmountOnExit>
            <Box sx={{ ...card, mt: 3, textAlign: "left", maxWidth: 900, mx: "auto" }}>
              <Typography component="h3" sx={sectionTitle}>
                ఇప్పటివరకు ఉన్నవి
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 0, listStyle: "none", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                {STATS.map(([n, label]) => (
                  <Box component="li" key={label} sx={{ p: 1.5, borderRadius: "var(--radius-sm)", bgcolor: SURFACE }}>
                    <Box sx={{ fontWeight: 800, fontSize: "1.3rem", color: MAROON, fontVariantNumeric: "tabular-nums" }}>{n}</Box>
                    <Box sx={{ fontSize: "1rem", lineHeight: 1.5 }}>{label}</Box>
                  </Box>
                ))}
              </Box>

              <Typography component="h3" sx={sectionTitle}>
                మా మాట
              </Typography>
              <Stack spacing={1}>
                {PROMISES.map(({ title, text, Icon }) => (
                  <Box key={title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                    <Icon sx={{ fontSize: "1.5rem", color: GREEN, flexShrink: 0, mt: 0.25 }} aria-hidden />
                    <Typography sx={{ fontSize: "1.05rem", lineHeight: 1.8 }}>
                      <strong>{title}:</strong> {text}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Typography component="h3" sx={sectionTitle}>
                సాంకేతికత
              </Typography>
              <Box sx={{ p: 2, mb: 2, borderRadius: "var(--radius-sm)", border: `2px solid ${MAROON}`, bgcolor: `color-mix(in srgb, ${MAROON} 6%, ${SURFACE})`, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <GridViewTwoToneIcon sx={{ fontSize: "2rem", color: MAROON, flexShrink: 0 }} aria-hidden />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                    Yuktai Grid{" "}
                    <Box component="span" sx={{ fontWeight: 700, fontSize: "1rem", color: MAROON }}>
                      — మా సొంత, ఓపెన్ సోర్స్
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: "1.02rem", lineHeight: 1.8, mt: 0.5 }}>
                    యుక్తిశాల AI తయారుచేసిన తెలుగు పట్టిక — వెతకడం, క్రమం, పేజీలు, ఫోన్‌లో కార్డులు, AI సహాయకుడు. కథల పట్టిక, శైలిమాల ఫాంట్ల జాబితా ఇదే.{" "}
                    <Box component="a" href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noopener noreferrer" sx={{ color: GOLD_TEXT, fontWeight: 700, textDecoration: "underline", ...FOCUS }}>
                      npm
                    </Box>{" "}
                    ·{" "}
                    <Box component="a" href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noopener noreferrer" sx={{ color: GOLD_TEXT, fontWeight: 700, textDecoration: "underline", ...FOCUS }}>
                      GitHub
                    </Box>
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                {TECH.map((tg) => (
                  <Box key={tg.group}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: GREEN, mb: 0.75 }}>{tg.group}</Typography>
                    <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "15em 1fr" }, columnGap: 2, rowGap: { xs: 0.25, sm: 0.75 } }}>
                      {tg.items.map((t) => (
                        <Box key={t.name} sx={{ display: "contents" }}>
                          <Box component="dt" sx={{ fontWeight: 700, fontSize: "1rem", mt: { xs: 1, sm: 0 } }}>
                            {t.name}
                          </Box>
                          <Box component="dd" sx={{ m: 0, fontSize: "1rem", color: MUTED, lineHeight: 1.7 }}>
                            {t.does}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Typography component="h3" sx={sectionTitle}>
                స్వరాలు
              </Typography>
              <Typography sx={{ fontSize: "1.02rem", lineHeight: 1.9 }}>
                <strong>మగ / స్త్రీ స్వరం</strong> — Microsoft AI వాయిస్‌లు (Mohan, Shruti):{" "}
                <Box component="a" href="https://speech.microsoft.com/portal/voicegallery" target="_blank" rel="noopener noreferrer" sx={{ color: GOLD_TEXT, textDecoration: "underline", overflowWrap: "anywhere", ...FOCUS }}>
                  speech.microsoft.com
                </Box>
                . <strong>Google TTS</strong> — Google Translate లో వినే అదే స్వరం:{" "}
                <Box component="a" href="https://translate.google.com" target="_blank" rel="noopener noreferrer" sx={{ color: GOLD_TEXT, textDecoration: "underline", ...FOCUS }}>
                  translate.google.com
                </Box>
                .
              </Typography>

              <Typography component="h3" sx={sectionTitle}>
                కృతజ్ఞతలు
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "1.05rem", lineHeight: 1.9 }}>
                <li>
                  <strong>రత్నాలబాల పద్యాలు</strong> — మిరియాల వెంకటరత్నం గారు
                </li>
                <li>
                  <strong>మిరా పద్యాలు</strong> — డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు
                </li>
                <li>
                  <strong>వేదిక</strong> — యుక్తిశాల AI
                </li>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Container>
    </Box>
  );
}