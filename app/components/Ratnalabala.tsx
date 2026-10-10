"use client";

/* ═══════════════════════════════════════════════════════════════
   జ్ఞానమాల — అన్ని మాలలు ఒకే చోట

   • పైన: సైట్ పేరు + పాల్కురికి సోమన పద్యం (ఆకుపచ్చ బ్యాండ్, Navbar రంగు)
   • స్వరమాల రేడియో + పోస్టర్ / వీడియో / వాయిస్ డౌన్‌లోడ్లు
   • మాలల జాబితా: బంగారు దారం, ఒక్కో గుంపుకు ఒక పూస (Navbar లోని అన్ని మాలలూ)
   • 60+ పాఠకుల కోసం: అక్షరాలు ≥ 0.95rem, నొక్కే చోటు ≥ 48px, AAA రంగులు,
     కదిలే animations లేవు; dark mode site tokens తో ఆటోమేటిక్
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Collapse, Container, Divider, Stack, Typography } from "@mui/material";
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
import VolumeUpTwoToneIcon from "@mui/icons-material/VolumeUpTwoTone";
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
import type { SvgIconComponent } from "@mui/icons-material";

/* ─── site tokens (globals.css) — dark mode ఆటోమేటిక్ ─── */
const INK = "var(--foreground)";
const PAPER = "var(--background)";
const MAROON = "var(--primary)";
const GREEN = "var(--secondary)";
const GOLD_SHAPE = "var(--accent)"; // దారం, పూసలు మాత్రమే — అక్షరాలకు కాదు
const GOLD_TEXT = "var(--accent-text)"; // తెలుపు నేపథ్యంపై బంగారు అక్షరం (8.2:1)
const MUTED = "var(--muted-text)";
const CARD_BG = "var(--surface-elevated)";
const BORDER_STRONG = "var(--border-strong)";
const FOCUS = { "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: "2px" } };

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
      { label: "ఖతిమాల", path: "/khatiMala", intro: "50+ తెలుగు ఫాంట్లతో పాఠ్య రచన", Icon: FontDownloadTwoToneIcon },
      { label: "విదురమాల", path: "/rahasyabhasha", intro: "రహస్య భాష శైలుల అన్వేషణ, అభ్యాసం", Icon: VpnKeyTwoToneIcon },
      { label: "శైలిమాల", path: "/shailimala", intro: "రచనా శైలుల పరిచయం, అభ్యాసం", Icon: StyleTwoToneIcon },
    ],
  },
  {
    label: "ఇంకా",
    Icon: LocalLibraryTwoToneIcon,
    color: GREEN,
    items: [
      { label: "వాచకమాల", path: "/news", intro: "తెలుగు వాచకి — వార్తలు చదవండి, వినండి", Icon: NewspaperTwoToneIcon },
      { label: "గీతామాల", path: "/geeta", intro: "భగవద్గీత శ్లోకాలు", Icon: TempleHinduTwoToneIcon },
      { label: "PDF ప్రశ్నోత్తరి", path: "/prashnottari", intro: "మీ తెలుగు PDF అప్‌లోడ్ చేసి ప్రశ్నలు అడగండి", Icon: QuizTwoToneIcon },
    ],
  },
];

/* ─── "ప్రాజెక్ట్ గురించి" ─── */
const FEEDBACK_URL = "https://forms.gle/z4zugcnmZrW9d9cR9"; // Navbar లోని అదే ఫారం

const DO_HERE: { title: string; text: string; path: string; Icon: SvgIconComponent }[] = [
  { title: "చదవండి", text: "పద్యాలు, శతకాలు, కథలు, జ్ఞాపకాలు", path: "/poems", Icon: AutoStoriesTwoToneIcon },
  { title: "వినండి", text: "మగ, స్త్రీ స్వరాల్లో — స్వరమాల రేడియోతో వరుసగా", path: "/swaramala", Icon: HeadphonesTwoToneIcon },
  { title: "నేర్చుకోండి", text: "అక్షరాలు, గుణింతాలు, సంధులు, సమాసాలు, సామెతలు", path: "/aksharamala", Icon: SchoolTwoToneIcon },
  { title: "సృష్టించండి", text: "పద్యాలను పోస్టర్లు, వీడియోలుగా; 50+ తెలుగు ఫాంట్లతో", path: "/chitramala", Icon: BrushTwoToneIcon },
  { title: "అడగండి", text: "మీ తెలుగు PDF పై ప్రశ్నలు — జవాబు పేజీ సంఖ్యతో", path: "/prashnottari", Icon: ForumTwoToneIcon },
];

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
  {
    title: "మీ గోప్యత",
    text: "మీరు చేర్చిన ఫాంట్లు మీ పరికరంలోనే ఉంటాయి. PDF ఫైల్ సేవ్ కాదు, దాని పాఠ్యం 24 గంటల్లో తొలగిపోతుంది.",
    Icon: LockTwoToneIcon,
  },
];

/* సాంకేతికత — ఒక్కొక్కటి పాఠకుడికి ఏం చేస్తుందో సాధారణ మాటల్లో */
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

const sectionTitle = { fontWeight: 800, fontSize: "1.1rem", mb: 1.25, mt: 3, "&:first-of-type": { mt: 0 } } as const;

/* బంగారు దారంపై గుంపు పూస */
function GroupBead({ Icon, color }: { Icon: SvgIconComponent; color: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        bgcolor: CARD_BG,
        border: `2px solid ${color}`,
        boxShadow: `0 0 0 4px ${PAPER}`,
        position: "relative",
        zIndex: 1,
      }}
    >
      <Icon sx={{ fontSize: "1.25rem", color }} />
    </Box>
  );
}

/* తెరుచుకునే విభాగం బటన్ — పెద్దగా, స్పష్టంగా */
function ToggleButton({
  open,
  onClick,
  icon,
  children,
  color = MAROON,
}: {
  open: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Button
      onClick={onClick}
      aria-expanded={open}
      startIcon={icon}
      endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
      sx={{ minHeight: 48, px: 2, textTransform: "none", fontWeight: 700, fontSize: "1rem", color, borderRadius: "var(--radius-sm)", ...FOCUS }}
    >
      {children}
    </Button>
  );
}

export default function RatnalabalaHighlights() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [voicesOpen, setVoicesOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/poems");
        if (!res.ok) throw new Error(String(res.status));
        const data: Record<string, string> = await res.json();
        if (alive) setPoems(Object.entries(data).map(([title, content]) => ({ title, content, slug: title })));
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

  return (
    <Box sx={{ bgcolor: PAPER, color: INK }}>
      {/* ═══════════ పైభాగం — Navbar రంగు ఆకుపచ్చ బ్యాండ్ + సోమన పద్యం ═══════════ */}
      <Box component="header" sx={{ bgcolor: GREEN, color: PAPER, py: { xs: 5, md: 7 }, px: 2 }}>
        <Container maxWidth="md" disableGutters sx={{ textAlign: "center" }}>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.2rem", md: "2.9rem" }, lineHeight: 1.3 }}>
            రత్నాలబాల
          </Typography>
          <Typography sx={{ fontSize: { xs: "1.15rem", md: "1.3rem" }, fontWeight: 700, color: "var(--accent-light)", mt: 0.5 }}>
            జ్ఞానమాల
          </Typography>

          <Box aria-hidden sx={{ width: 56, height: 3, bgcolor: "var(--accent-light)", mx: "auto", my: 3, borderRadius: 2 }} />

          <Box component="figure" sx={{ m: 0 }}>
            <Typography
              component="blockquote"
              sx={{ m: 0, fontSize: { xs: "1.02rem", md: "1.12rem" }, lineHeight: 2, whiteSpace: "pre-line" }}
            >
              {`అమిత యశస్క ఆద్యయన ఇద్రుచి ఈశ్వర ఉగ్ర ఊర్జిత
క్రమ ఋషభాంక ౠజిహర ఌస్తిత ౡస్మిత ఏకరుద్ర ఐం
ద్రమహిత రూప ఓమితి పదద్యుతి ఔర్వ లలాట అంబికా
సమరసభావ అఃకలిత వర్ణనుతం బసవేశ పాహిమాం!!`}
            </Typography>
            <Typography component="figcaption" sx={{ fontSize: "1rem", fontWeight: 700, mt: 1.5, opacity: 0.95 }}>
              — పాల్కురికి సోమన
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 5 } }}>
        {/* ═══════════ పరిచయం ═══════════ */}
        <Box component="section" aria-label="పరిచయం" sx={{ mb: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: "1.08rem", lineHeight: 1.9, maxWidth: "34em", mx: "auto" }}>
            తెలుగు పద్యాలు, శతకాలు, కథలు, వ్యాకరణం — ఒకే వేదికపై చదవడానికి, వినడానికి, నేర్చుకోవడానికి. ఉచిత, వాణిజ్యేతర ప్రాజెక్ట్.
          </Typography>

          <Box sx={{ mt: 1 }}>
            <ToggleButton open={aboutOpen} onClick={() => setAboutOpen((v) => !v)}>
              {aboutOpen ? "తక్కువగా చూపించు" : "ప్రాజెక్ట్ గురించి పూర్తిగా చదవండి"}
            </ToggleButton>
          </Box>

          <Collapse in={aboutOpen} timeout={200} unmountOnExit>
            <Box
              sx={{ mt: 2, p: { xs: 2, sm: 3 }, textAlign: "left", borderRadius: "var(--radius)", border: `1.5px solid ${BORDER_STRONG}`, bgcolor: CARD_BG }}
            >
              {/* 1. ఎందుకు */}
              <Typography component="h3" sx={sectionTitle}>
                ఈ వేదిక ఎందుకు
              </Typography>
              <Typography sx={{ fontSize: "1.02rem", lineHeight: 1.9, maxWidth: "36em" }}>
                తెలుగు పద్యాలు, కథలు, వ్యాకరణం పుస్తకాల్లో, జ్ఞాపకాల్లో మాత్రమే ఉండిపోకూడదు. వాటిని ఫోన్‌లో, కంప్యూటర్‌లో ఎవరైనా
                సులభంగా చదవడానికి, వినడానికి, తర్వాతి తరాలకు అందించడానికి ఈ వేదిక. పెద్ద అక్షరాలు, స్పష్టమైన రంగులు, వినే సౌకర్యంతో
                — పెద్దవాళ్ళకూ సులభంగా ఉండేలా తయారైంది.
              </Typography>

              {/* 2. ఏం చేయవచ్చు */}
              <Typography component="h3" sx={sectionTitle}>
                ఇక్కడ మీరు ఏం చేయవచ్చు
              </Typography>
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                {DO_HERE.map(({ title, text, path, Icon }) => (
                  <li key={title}>
                    <Box
                      component={Link}
                      href={path}
                      sx={{
                        height: "100%",
                        minHeight: 56,
                        display: "flex",
                        gap: 1.25,
                        alignItems: "flex-start",
                        p: 1.5,
                        borderRadius: "var(--radius-sm)",
                        bgcolor: "var(--surface)",
                        color: INK,
                        textDecoration: "none",
                        border: "1px solid transparent",
                        "&:hover": { borderColor: BORDER_STRONG },
                        ...FOCUS,
                      }}
                    >
                      <Icon sx={{ fontSize: "1.5rem", color: MAROON, flexShrink: 0, mt: 0.25 }} aria-hidden />
                      <Box>
                        <Box sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{title}</Box>
                        <Box sx={{ fontSize: "0.95rem", color: MUTED, lineHeight: 1.6 }}>{text}</Box>
                      </Box>
                    </Box>
                  </li>
                ))}
              </Box>

              {/* 3. ఎంత ఉంది */}
              <Typography component="h3" sx={sectionTitle}>
                ఇప్పటివరకు ఉన్నవి
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 0, listStyle: "none", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                {STATS.map(([n, label], i) => (
                  <Box
                    component="li"
                    key={label}
                    sx={{
                      p: 1.25,
                      borderRadius: "var(--radius-sm)",
                      bgcolor: i === 0 ? "color-mix(in srgb, var(--primary) 8%, var(--surface))" : "var(--surface)",
                      gridColumn: i === 0 ? { xs: "1 / -1", sm: "auto" } : undefined,
                    }}
                  >
                    <Box sx={{ fontWeight: 800, fontSize: i === 0 ? "1.5rem" : "1.25rem", color: MAROON, fontVariantNumeric: "tabular-nums" }}>{n}</Box>
                    <Box sx={{ fontSize: "0.95rem", lineHeight: 1.5 }}>{label}</Box>
                  </Box>
                ))}
              </Box>

              {/* 4. మా మాట */}
              <Typography component="h3" sx={sectionTitle}>
                మా మాట
              </Typography>
              <Stack spacing={1}>
                {PROMISES.map(({ title, text, Icon }) => (
                  <Box key={title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                    <Icon sx={{ fontSize: "1.5rem", color: GREEN, flexShrink: 0, mt: 0.25 }} aria-hidden />
                    <Typography sx={{ fontSize: "1rem", lineHeight: 1.8 }}>
                      <strong>{title}:</strong> {text}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* 5. సాంకేతికత */}
              <Typography component="h3" sx={sectionTitle}>
                సాంకేతికత
              </Typography>

              {/* మా సొంత: Yuktai Grid */}
              <Box
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: "var(--radius-sm)",
                  border: `2px solid ${MAROON}`,
                  bgcolor: "color-mix(in srgb, var(--primary) 6%, var(--surface))",
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                }}
              >
                <GridViewTwoToneIcon sx={{ fontSize: "2rem", color: MAROON, flexShrink: 0 }} aria-hidden />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                    Yuktai Grid{" "}
                    <Box component="span" sx={{ fontWeight: 700, fontSize: "0.95rem", color: MAROON }}>
                      — మా సొంత library
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: "1rem", lineHeight: 1.8, mt: 0.5 }}>
                    యుక్తిశాల AI తయారుచేసిన తెలుగు పట్టిక (grid). కథలు, పద్యాల జాబితాలను పట్టికగా చూపించి, వెతకడానికి, వరుస మార్చడానికి,
                    <strong> PDF, Excel </strong>గా డౌన్‌లోడ్ చేసుకోవడానికి వీలు కల్పిస్తుంది. స్మృతిమాల లోని "కథల పట్టిక" ఇదే.
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1.5}>
                {TECH.map((g) => (
                  <Box key={g.group}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: GREEN, mb: 0.75 }}>{g.group}</Typography>
                    <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "15em 1fr" }, columnGap: 2, rowGap: { xs: 0.25, sm: 0.75 } }}>
                      {g.items.map((t) => (
                        <Box key={t.name} sx={{ display: "contents" }}>
                          <Box component="dt" sx={{ fontWeight: 700, fontSize: "0.98rem", mt: { xs: 1, sm: 0 } }}>
                            {t.name}
                          </Box>
                          <Box component="dd" sx={{ m: 0, fontSize: "0.98rem", color: MUTED, lineHeight: 1.7 }}>
                            {t.does}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>

              {/* 6. ఎవరివి */}
              <Typography component="h3" sx={sectionTitle}>
                కృతజ్ఞతలు
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "1rem", lineHeight: 1.9 }}>
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

              {/* 7. అభిప్రాయం */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: "var(--radius-sm)",
                  bgcolor: "color-mix(in srgb, var(--secondary) 8%, var(--surface))",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Typography sx={{ flex: "1 1 16em", fontSize: "1rem", lineHeight: 1.8 }}>
                  ఏదైనా పద్యం తప్పుగా ఉందా? కొత్త మాల కావాలా? మీ మాట మాకు ముఖ్యం.
                </Typography>
                <Button
                  component="a"
                  href={FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<ChatBubbleOutlineRoundedIcon />}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "1rem",
                    borderRadius: "var(--radius-sm)",
                    bgcolor: GREEN,
                    color: PAPER,
                    "&:hover": { bgcolor: GREEN, filter: "brightness(1.1)" },
                    ...FOCUS,
                  }}
                >
                  అభిప్రాయం చెప్పండి
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>

        {/* ═══════════ స్వరమాల రేడియో + డౌన్‌లోడ్లు ═══════════ */}
        <Box component="section" aria-labelledby="radio-title" sx={{ mb: 5 }}>
          {loading && (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }} role="status">
              <CircularProgress size={28} sx={{ color: MAROON }} />
              <Typography sx={{ fontSize: "1rem", color: MUTED }}>పద్యాలు లోడ్ అవుతున్నాయి…</Typography>
            </Stack>
          )}

          {error && (
            <Typography role="alert" align="center" sx={{ py: 3, fontSize: "1rem", color: "var(--error)" }}>
              {error}
            </Typography>
          )}

          {!loading && !error && poems.length > 0 && (
            <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: "center", borderRadius: "var(--radius)", border: `1.5px solid ${BORDER_STRONG}`, bgcolor: CARD_BG }}>
              <Typography id="radio-title" component="h2" sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 0.5 }}>
                🎧 స్వరమాల రేడియో
              </Typography>
              <Typography sx={{ fontSize: "1rem", color: MUTED, mb: 2 }}>
                స్వరం ఎంచుకుని {poems.length} పద్యాలు వరుసగా వినండి.
              </Typography>

              <PoemRadio poems={poems} />

              <Box sx={{ mt: 2 }}>
                <ToggleButton open={toolsOpen} onClick={() => setToolsOpen((v) => !v)} icon={<DownloadForOfflineRoundedIcon />}>
                  పోస్టర్లు, వీడియోలు, వాయిస్‌లు డౌన్‌లోడ్ చేయండి
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
          )}
        </Box>

        {/* ═══════════ మాలలు — బంగారు దారం, గుంపుకు ఒక పూస ═══════════ */}
        <Box component="section" aria-labelledby="malas-title">
          <Typography id="malas-title" component="h2" textAlign="center" sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 3 }}>
            మాలలు అన్వేషించండి
          </Typography>

          <Box sx={{ position: "relative", pl: { xs: 3.5, sm: 4.5 } }}>
            <Box
              aria-hidden
              sx={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 3, borderRadius: 2, bgcolor: GOLD_SHAPE, opacity: 0.55 }}
            />

            <Stack spacing={4}>
              {GROUPS.map((group) => (
                <Box key={group.label} component="nav" aria-label={group.label}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, ml: { xs: -3.5, sm: -4.5 } }}>
                    <GroupBead Icon={group.Icon} color={group.color} />
                    <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.15rem" }}>
                      {group.label}
                    </Typography>
                  </Stack>

                  <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.25 }}>
                    {group.items.map((item) => (
                      <li key={item.path}>
                        <Box
                          component={Link}
                          href={item.path}
                          sx={{
                            height: "100%",
                            minHeight: 64,
                            textDecoration: "none",
                            color: INK,
                            display: "flex",
                            gap: 1.5,
                            alignItems: "flex-start",
                            borderRadius: "var(--radius-sm)",
                            p: 1.75,
                            bgcolor: CARD_BG,
                            border: `1.5px solid ${BORDER_STRONG}`,
                            borderLeft: `5px solid ${group.color}`,
                            "&:hover": { bgcolor: "var(--surface)" },
                            ...FOCUS,
                          }}
                        >
                          <item.Icon sx={{ fontSize: "1.5rem", color: group.color, mt: 0.25, flexShrink: 0 }} aria-hidden />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.5 }}>{item.label}</Typography>
                            <Typography sx={{ fontSize: "0.95rem", color: MUTED, lineHeight: 1.6 }}>{item.intro}</Typography>
                          </Box>
                        </Box>
                      </li>
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* ═══════════ స్వరాల గురించి ═══════════ */}
        <Box component="section" aria-label="స్వరాల గురించి" sx={{ mt: 5 }}>
          <ToggleButton open={voicesOpen} onClick={() => setVoicesOpen((v) => !v)} icon={<VolumeUpTwoToneIcon />} color={MUTED}>
            స్వరాల గురించి
          </ToggleButton>

          <Collapse in={voicesOpen} timeout={200} unmountOnExit>
            <Box sx={{ mt: 1.5, p: { xs: 2, sm: 2.5 }, borderRadius: "var(--radius)", bgcolor: CARD_BG, border: `1px solid ${BORDER_STRONG}` }}>
              <Typography sx={{ fontSize: "1rem", lineHeight: 1.8 }}>
                <strong>మగ / స్త్రీ స్వరం</strong> — Microsoft AI వాయిస్‌లు (Mohan, Shruti).{" "}
                <Box
                  component="a"
                  href="https://speech.microsoft.com/portal/voicegallery"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: GOLD_TEXT, textDecoration: "underline", overflowWrap: "anywhere", ...FOCUS }}
                >
                  speech.microsoft.com/portal/voicegallery
                </Box>
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: "var(--border)" }} />
              <Typography sx={{ fontSize: "1rem", lineHeight: 1.8 }}>
                <strong>Google TTS</strong> — Google Translate లో వినే అదే స్వరం.{" "}
                <Box
                  component="a"
                  href="https://translate.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: GOLD_TEXT, textDecoration: "underline", ...FOCUS }}
                >
                  translate.google.com
                </Box>
              </Typography>
            </Box>
          </Collapse>
        </Box>
      </Container>
    </Box>
  );
}