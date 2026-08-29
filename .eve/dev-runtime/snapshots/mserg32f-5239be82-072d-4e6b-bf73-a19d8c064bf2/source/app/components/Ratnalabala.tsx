"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Button,
  Collapse,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import AgentPoemButton from "../components/AgentPoemButton";
import DownloadAllPosters from "../components/DownloadAllPosters";
import DownloadAllVoices from "../components/DownloadAllVoices";
import PoemRadio from "../components/Poemradio";
import DownloadAllVideos from "../components/DownloadAllVideos";

import MenuBookTwoToneIcon from "@mui/icons-material/MenuBookTwoTone";
import SpellcheckTwoToneIcon from "@mui/icons-material/SpellcheckTwoTone";
import PaletteTwoToneIcon from "@mui/icons-material/PaletteTwoTone";
import AutoStoriesTwoToneIcon from "@mui/icons-material/AutoStoriesTwoTone";
import SelfImprovementTwoToneIcon from "@mui/icons-material/SelfImprovementTwoTone";
import ImportContactsTwoToneIcon from "@mui/icons-material/ImportContactsTwoTone";
import HistoryEduTwoToneIcon from "@mui/icons-material/HistoryEduTwoTone";
import ChromeReaderModeTwoToneIcon from "@mui/icons-material/ChromeReaderModeTwoTone";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
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
import VolumeUpTwoToneIcon from "@mui/icons-material/VolumeUpTwoTone";
import SmartToyTwoToneIcon from "@mui/icons-material/SmartToyTwoTone";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import type { SvgIconComponent } from "@mui/icons-material";

/* ─────────────────────────────────────────────────────────────────
   TOKENS — a manuscript palette (ink / parchment / turmeric / kumkum /
   forest teal), not the usual cream+terracotta pairing. The signature
   element is literal: every module name here ends in "-మాల" (a garland,
   a string of beads), so the module list is built as a gold thread with
   a bead at each group — not a generic icon-card grid.
   ───────────────────────────────────────────────────────────────── */
const INK = "#201B14";
const PARCHMENT = "#F1E6CC";
const GOLD = "#B98A2E";
const MAROON = "#7A2A2E";
const TEAL = "#274B3F";
const MUTED = "#5B4636";
const PAGE_BG = "#FAF5E8";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const POETRY_NAME = "రత్నాలబాల – జ్ఞానమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";

const NAV_GROUPS_RAW = [
  {
    label: "సాహిత్యం",
    Icon: MenuBookTwoToneIcon,
    color: MAROON,
    items: [
      { label: "పద్యాలవాల", path: "/poems", intro: "మిరియాల వెంకటరత్నం గారి పద్యాలు", Icon: AutoStoriesTwoToneIcon },
      { label: "మిరా", path: "/mirapoems", intro: "డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారి పద్యాలు", Icon: SelfImprovementTwoToneIcon },
      { label: "శతకాలమాల", path: "/shatakamu", intro: "ప్రసిద్ధ తెలుగు శతకాల సేకరణ", Icon: ImportContactsTwoToneIcon },
      { label: "స్మృతిమాల", path: "/smruthimala", intro: "జ్ఞాపకాలు, స్మారక పద్యాల సంకలనం", Icon: HistoryEduTwoToneIcon },
      { label: "కథామాల", path: "/kathamala", intro: "నీతికథలు, చిన్న కథల డిజిటల్ సంగ్రహం", Icon: ChromeReaderModeTwoToneIcon },
      { label: "పరాభవమాల", path: "/parabhava", intro: "ఉగాది శతకం: పరాభవ నామ సంవత్సర స్వాగతం", Icon: WbSunnyTwoToneIcon },
    ],
  },
  {
    label: "వ్యాకరణం",
    Icon: SpellcheckTwoToneIcon,
    color: TEAL,
    items: [
      { label: "అక్షరమాల", path: "/aksharamala", intro: "తెలుగు అక్షరాల అభ్యాసం మరియు అన్వేషణ", Icon: AbcTwoToneIcon },
      { label: "గుణింతమాల", path: "/guninta", intro: "34 వ్యంజనాలు · ప్రతి అక్షరానికి 16 గుణింత రూపాలు", Icon: GraphicEqTwoToneIcon },
      { label: "పదాలమాల", path: "/padalamala", intro: "తెలుగు అక్షరాలతో కూడిన పదాలు — వినవచ్చు", Icon: TextFieldsTwoToneIcon },
      { label: "సామెతలమాల", path: "/sametalu", intro: "తెలుగు సామెతలు", Icon: FormatQuoteTwoToneIcon },
      { label: "సంధిమాల", path: "/sandhi", intro: "తెలుగు సంధిల అన్వేషణ మరియు అభ్యాసం", Icon: JoinFullTwoToneIcon },
      { label: "సమాసముమాల", path: "/samasa", intro: "తెలుగు సమాసాల అభ్యాసం మరియు అన్వేషణ", Icon: CallMergeTwoToneIcon },
    ],
  },
  {
    label: "కళలు",
    Icon: PaletteTwoToneIcon,
    color: GOLD,
    items: [
      { label: "చిత్రమాల", path: "/chitramala", intro: "పద్యాలను చిత్రాలుగా మార్చే యంత్రం", Icon: ImageTwoToneIcon },
      { label: "స్వరమాల", path: "/swaramala", intro: "చదవండి, వినండి – తెలుగు స్వరాల అనుభవం", Icon: MicTwoToneIcon },
      { label: "లిపిమాల", path: "/lipimala", intro: "తెలుగు లిపుల పరిచయం & రూపాంతరం OCR తో", Icon: TranslateTwoToneIcon },
      { label: "ఖతిమాల", path: "/khatiMala", intro: "50+ తెలుగు ఫాంట్లతో పాఠ్య రచన", Icon: FontDownloadTwoToneIcon },
      { label: "విదురమాల", path: "/rahasyabhasha", intro: "రహస్య భాష శైలుల అన్వేషణ మరియు అభ్యాసం", Icon: VpnKeyTwoToneIcon },
      { label: "శైలిమాల", path: "/shailimala", intro: "రచనా శైలుల పరిచయం మరియు అభ్యాసం", Icon: StyleTwoToneIcon },
    ],
  },
];

const reducedMotionOff = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none !important",
    transition: "none !important",
  },
};

const fadeInUp = {
  "@keyframes fadeInUp": {
    from: { opacity: 0, transform: "translateY(12px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};

function Reveal({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <Box sx={{ ...fadeInUp, animation: `fadeInUp 0.5s ease both`, animationDelay: `${delay}s`, ...reducedMotionOff }}>
      {children}
    </Box>
  );
}

function GroupBead({ Icon, color }: { Icon: SvgIconComponent; color: string }) {
  return (
    <Box
      sx={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        bgcolor: PARCHMENT, border: `2px solid ${color}`,
        boxShadow: `0 0 0 4px ${PAGE_BG}`,
        position: "relative", zIndex: 1,
      }}
    >
      <Icon sx={{ fontSize: "1.05rem", color }} />
    </Box>
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
    const load = async () => {
      try {
        const res = await fetch("/api/poems");
        if (!res.ok) throw new Error();
        const data: Record<string, string> = await res.json();
        const arr: Poem[] = Object.entries(data).map(([title, content]) => ({
          title,
          content,
          slug: title,
        }));
        setPoems(arr);
      } catch {
        setError("పద్యాలను లోడ్ చేయడంలో లోపం సంభవించింది.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ bgcolor: PAGE_BG }}>
      {/* ═══════════ HERO — dark ink band, gold hairline, sample verse
          as a quiet epigraph inside the hero itself instead of a
          separate card further down the page. ═══════════ */}
      <Box sx={{ bgcolor: INK, color: PARCHMENT, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Reveal delay={0}>
            <Typography
              fontFamily="'Noto Serif Telugu', serif"
              fontWeight={700}
              fontSize={{ xs: "2.1rem", md: "2.75rem" }}
              textAlign="center"
              sx={{ letterSpacing: "-0.3px" }}
            >
              రత్నాలబాల
            </Typography>
            <Typography
              fontFamily="'Noto Serif Telugu', serif"
              fontSize={{ xs: "1rem", md: "1.15rem" }}
              textAlign="center"
              sx={{ color: GOLD, mt: 0.5, mb: 3 }}
            >
              జ్ఞానమాల
            </Typography>

            <Box sx={{ width: 48, height: 2, bgcolor: GOLD, mx: "auto", mb: 3 }} />

            <Typography
              fontFamily="'Noto Serif Telugu', serif"
              textAlign="center"
              sx={{ fontSize: { xs: "0.98rem", md: "1.05rem" }, lineHeight: 2, whiteSpace: "pre-line", opacity: 0.9 }}
            >
              {`అమిత యశస్క ఆద్యయన ఇద్రుచి ఈశ్వర ఉగ్ర ఊర్జిత
క్రమ ఋషభాంక ౠజిహర ఌస్తిత ౡస్మిత ఏకరుద్ర ఐం
ద్రమహిత రూప ఓమితి పదద్యుతి ఔర్వ లలాట అంబికా
సమరసభావ అఃకలిత వర్ణనుతం బసవేశ పాహిమాం!!`}
            </Typography>
            <Typography textAlign="center" sx={{ fontSize: "0.8rem", color: GOLD, mt: 1.5 }}>
              — పాల్కురికి సోమన
            </Typography>
          </Reveal>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 5 } }}>
        {/* ═══════════ ABOUT — condensed to a short lede; the full
            paragraph is one tap away instead of dominating the page. ═══ */}
        <Reveal delay={0.06}>
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{ fontSize: "1rem", color: INK, lineHeight: 1.9, textAlign: "center", maxWidth: 640, mx: "auto" }}
            >
              తెలుగు పద్యాలు, శతకాలు, కథలు, వ్యాకరణం — ఒకే వేదికపై, చదవడానికి,
              వినడానికి మరియు నేర్చుకోవడానికి వీలుగా. ఉచిత, వాణిజ్యేతర ప్రాజెక్ట్.
            </Typography>

            <Box textAlign="center" sx={{ mt: 1 }}>
              <Button
                onClick={() => setAboutOpen((v) => !v)}
                size="small"
                sx={{ textTransform: "none", color: MAROON, fontWeight: 600 }}
                endIcon={aboutOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              >
                {aboutOpen ? "తక్కువగా చూపించు" : "ప్రాజెక్ట్ గురించి పూర్తిగా చదవండి"}
              </Button>
            </Box>

            <Collapse in={aboutOpen} timeout={240} unmountOnExit>
              <Card sx={{ mt: 2, borderRadius: 3, border: `1px solid ${GOLD}55`, bgcolor: "#fff" }}>
                <CardContent>
                  <Typography sx={{ fontSize: "0.92rem", color: INK, lineHeight: 1.9, textAlign: "justify" }}>
                    తెలుగు భాష, సాహిత్యం మరియు సంస్కృతిని ఆధునిక సాంకేతికతతో
                    అనుసంధానించి, భవిష్యత్ తరాలకు డిజిటల్ రూపంలో భద్రపరచాలనే
                    లక్ష్యంతో రూపొందించబడిన సమగ్ర తెలుగు సాహిత్య వేదిక ఇది.
                    ప్రస్తుతం <strong>34 రత్నాలబాల పద్యాలు</strong>,{" "}
                    <strong>3 మిరా పద్యాలు</strong>, <strong>10 శతకములు (1037 పద్యాలు)</strong>,{" "}
                    <strong>130 కథలు</strong>, <strong>108 పరాభవమాల పద్యాలు</strong>,{" "}
                    <strong>145 తెలుగు పదాలు</strong>, <strong>26 సంధులు</strong> మరియు{" "}
                    <strong>AI ఆధారిత 1140+ పద్యాల విశ్లేషణ</strong> అందుబాటులో ఉన్నాయి —
                    మొత్తం <strong>1,280+ పద్యాలు</strong> ఈ వేదికలో.
                    <br />
                    <br />
                    AI, Text-to-Speech, OCR, Speech-to-Text మరియు Privacy-First
                    సాంకేతికతలతో చదవడం, వినడం, పోస్టర్లు/వీడియోలుగా మార్చడం వంటి
                    సౌకర్యాలను ఈ వేదిక అందిస్తుంది.
                  </Typography>
                </CardContent>
              </Card>
            </Collapse>
          </Box>
        </Reveal>

        {/* ═══════════ LISTEN + TOOLS — one panel, radio visible since
            it's the signature interactive feature, bulk export tools
            tucked behind a single toggle. ═══════════ */}
        {loading && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
            <CircularProgress size={26} sx={{ color: MAROON }} />
            <Typography sx={{ fontSize: "0.85rem", color: MUTED }}>పద్యాలు లోడ్ అవుతున్నాయి…</Typography>
          </Stack>
        )}

        {error && (
          <Typography align="center" color="error" sx={{ py: 3, fontSize: "0.9rem" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && poems.length > 0 && (
          <Reveal delay={0.12}>
            <Card sx={{ mb: 4, borderRadius: 3, border: `1px solid ${GOLD}44`, bgcolor: "#fff" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography fontWeight={800} sx={{ fontSize: "1rem", color: INK, mb: 0.5 }}>
                  🎧 స్వరమాల రేడియో
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: MUTED, mb: 2 }}>
                  మీ స్వరం ఎంచుకుని అన్ని పద్యాలు వరుసగా వినండి.
                </Typography>

                <PoemRadio poems={poems} />

                <Button
                  onClick={() => setToolsOpen((v) => !v)}
                  size="small"
                  fullWidth
                  startIcon={<DownloadForOfflineRoundedIcon fontSize="small" />}
                  endIcon={toolsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                  sx={{ mt: 2.5, textTransform: "none", fontWeight: 700, color: MAROON }}
                >
                  పోస్టర్లు · వీడియోలు · వాయిస్‌లు డౌన్‌లోడ్ చేయండి
                </Button>

                <Collapse in={toolsOpen} timeout={240} unmountOnExit>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <DownloadAllPosters poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                    {/* Fixed: authors/poetryName were missing here, so every
                        video's captured poster fell back to the generic
                        default photo instead of the real author photo. */}
                    <DownloadAllVideos poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                    <DownloadAllVoices poems={poems} />
                  </Stack>
                </Collapse>
              </CardContent>
            </Card>
          </Reveal>
        )}

        {/* ═══════════ MODULE MALA — the signature element. A gold
            thread runs down the left; each group is a bead on it; each
            item hangs off the thread. This literalises the fact that
            every module here is named "-మాల" (a garland/string of
            beads) instead of using a generic icon-card grid. ═══════════ */}
        <Reveal delay={0.18}>
          <Typography
            fontFamily="'Noto Serif Telugu', serif"
            textAlign="center"
            fontWeight={700}
            sx={{ fontSize: "1.3rem", color: INK, mb: 3 }}
          >
            మాలలు అన్వేషించండి
          </Typography>

          <Box sx={{ position: "relative", pl: { xs: 3, sm: 4 } }}>
            <Box
              aria-hidden
              sx={{
                position: "absolute", left: { xs: 16, sm: 16 }, top: 17, bottom: 17,
                width: 2, bgcolor: `${GOLD}66`,
              }}
            />

            <Stack spacing={4}>
              {NAV_GROUPS_RAW.map((group) => (
                <Box key={group.label} sx={{ position: "relative" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, ml: { xs: -3, sm: -4 } }}>
                    <GroupBead Icon={group.Icon} color={group.color} />
                    <Typography fontWeight={800} sx={{ fontSize: "1.02rem", color: INK }}>
                      {group.label}
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                      gap: 1.25,
                    }}
                  >
                    {group.items.map((item) => (
                      <Box
                        key={item.label}
                        component={Link}
                        href={item.path}
                        sx={{
                          textDecoration: "none", display: "flex", gap: 1.25, alignItems: "flex-start",
                          borderRadius: 2.5, p: 1.5, bgcolor: "#fff", border: "1px solid",
                          borderColor: `${group.color}33`,
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 16px ${group.color}26` },
                          "&:focus-visible": { outline: `2px solid ${group.color}`, outlineOffset: "2px" },
                          ...reducedMotionOff,
                        }}
                      >
                        <item.Icon sx={{ fontSize: "1.15rem", color: group.color, mt: 0.2, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: INK }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: "0.78rem", color: MUTED, lineHeight: 1.4 }}>
                            {item.intro}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Reveal>

        {/* ═══════════ AGENT SPOTLIGHT — quiet now, no bounce/glow;
            the gold border carries the emphasis instead. ═══════════ */}
        <Reveal delay={0.24}>
          <Box
            sx={{
              mt: 5, mb: 4, p: { xs: 2.5, md: 3 }, borderRadius: 4, textAlign: "center",
              bgcolor: INK, border: `1px solid ${GOLD}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 0.5 }}>
              <SmartToyTwoToneIcon sx={{ color: GOLD, fontSize: "1.3rem" }} />
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.05rem", md: "1.2rem" }, color: PARCHMENT }}>
                ఈరోజు నిర్ణయాత్మక పద్యం
              </Typography>
            </Stack>
            <Typography sx={{ color: `${PARCHMENT}CC`, fontSize: "0.85rem", mb: 2 }}>
              1140+ పద్యాలలో నుండి — ఒక్క క్లిక్‌తో మీ కోసం ఎంపిక
            </Typography>
            <Box sx={{ bgcolor: PARCHMENT, borderRadius: 3, p: { xs: 1.5, md: 2 } }}>
              <AgentPoemButton />
            </Box>
          </Box>
        </Reveal>

        {/* ═══════════ VOICE CREDITS — folded into a small accordion;
            supplementary attribution, not a headline section. ═══════════ */}
        <Reveal delay={0.3}>
          <Box sx={{ mb: 2 }}>
            <Button
              onClick={() => setVoicesOpen((v) => !v)}
              size="small"
              startIcon={<VolumeUpTwoToneIcon fontSize="small" />}
              endIcon={voicesOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              sx={{ textTransform: "none", color: MUTED, fontWeight: 600 }}
            >
              స్వరాల గురించి
            </Button>

            <Collapse in={voicesOpen} timeout={240} unmountOnExit>
              <Card sx={{ mt: 1.5, borderRadius: 3, bgcolor: "#fff" }}>
                <CardContent>
                  <Typography sx={{ fontSize: "0.85rem", color: INK, lineHeight: 1.7, mb: 1 }}>
                    <strong>మగ / స్త్రీ స్వరం</strong> — Microsoft AI వాయిసులు (Mohan &amp; Shruti).{" "}
                    <Typography component="a" href="https://speech.microsoft.com/portal/voicegallery" target="_blank" rel="noopener noreferrer" sx={{ color: MAROON, textDecoration: "underline", fontSize: "inherit" }}>
                      speech.microsoft.com/portal/voicegallery
                    </Typography>
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontSize: "0.85rem", color: INK, lineHeight: 1.7 }}>
                    <strong>Google TTS</strong> — Google Translate‌లో వినే అదే స్వరం.{" "}
                    <Typography component="a" href="https://translate.google.com" target="_blank" rel="noopener noreferrer" sx={{ color: MAROON, textDecoration: "underline", fontSize: "inherit" }}>
                      translate.google.com
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Collapse>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}