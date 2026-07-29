"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  Button,
  Collapse,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import AgentPoemButton from "@/app/components/AgentPoemButton";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "../components/DownloadAllVoices";

import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";

import DiamondTwoToneIcon from "@mui/icons-material/DiamondTwoTone";
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
import AssignmentTwoToneIcon from "@mui/icons-material/AssignmentTwoTone";
import CheckCircleTwoToneIcon from "@mui/icons-material/CheckCircleTwoTone";
import LockTwoToneIcon from "@mui/icons-material/LockTwoTone";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import type { SvgIconComponent } from "@mui/icons-material";

// ── Accessible palette (unchanged) ──────────────────────────────────
const ACCENTS = ["#14532D", "#0F766E", "#92400E", "#9A3412", "#6B21A8"];
const MUTED_TEXT = "#475569";
const PAGE_BG = "#FBF9F6";

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

const NAV_GROUPS = NAV_GROUPS_RAW.map((group, gi) => ({
  ...group,
  color: ACCENTS[gi % ACCENTS.length],
  items: group.items.map((item, ii) => ({
    ...item,
    color: ACCENTS[(gi * 2 + ii) % ACCENTS.length],
  })),
}));

const ALL_MODULE_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

const actionChips = [
  "చదవండి", "వినండి", "రాయండి", "చిత్రీకరించండి", "పంచుకోండి",
  "నేర్చుకోండి", "అన్వేషించండి", "భద్రపరచండి", "చూడండి", "సృష్టించండి",
];

const reducedMotionOff = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none !important",
    transition: "none !important",
  },
};

const fadeInUp = {
  "@keyframes fadeInUp": {
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};

function Reveal({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <Box sx={{ ...fadeInUp, animation: `fadeInUp 0.6s ease both`, animationDelay: `${delay}s`, ...reducedMotionOff }}>
      {children}
    </Box>
  );
}

function IconBadge({
  Icon, color, size = 36, iconSize = "1.15rem",
}: { Icon: SvgIconComponent; color: string; size?: number; iconSize?: string }) {
  return (
    <Box
      sx={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        bgcolor: `${color}1A`, border: `1px solid ${color}33`,
      }}
    >
      <Icon sx={{ fontSize: iconSize, color }} />
    </Box>
  );
}

function SectionDivider({ Icon, color = ACCENTS[0] }: { Icon: SvgIconComponent; color?: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ my: 4 }}>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
      <IconBadge Icon={Icon} color={color} size={30} iconSize="1rem" />
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
    </Stack>
  );
}

export default function RatnalabalaHighlights() {

  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

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
    <Box sx={{ position: "relative", overflow: "hidden", bgcolor: PAGE_BG }}>
      <Box
        aria-hidden
        sx={{
          position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none",
          background: `
            radial-gradient(circle at 15% 10%, rgba(20,83,45,0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(107,33,168,0.06) 0%, transparent 40%),
            radial-gradient(circle at 30% 85%, rgba(15,118,110,0.07) 0%, transparent 40%)
          `,
        }}
      />

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {/* ═══════════ 1. HERO ═══════════ */}
        <Reveal delay={0}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
              <DiamondTwoToneIcon sx={{ fontSize: "2rem", color: ACCENTS[0] }} />
              <Typography
                fontSize={{ xs: "2rem", md: "2.6rem" }}
                fontWeight={900}
                sx={{ letterSpacing: "-0.5px", color: ACCENTS[0] }}
              >
                రత్నాలబాల – జ్ఞానమాల
              </Typography>
            </Stack>

            <Box
              sx={{
                width: 64, height: 4, borderRadius: 2, mx: "auto", mb: 2,
                background: `linear-gradient(90deg, ${ACCENTS[0]}, ${ACCENTS[4]})`,
              }}
            />

            <Typography sx={{ color: MUTED_TEXT, fontSize: "1rem" }}>
              తెలుగు సాహిత్యానికి సంపూర్ణ సాంకేతిక వేదిక.
            </Typography>

            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 2, rowGap: 1 }}>
              {[
                { label: `${ALL_MODULE_ITEMS.length} మాలలు`, color: ACCENTS[0] },
                { label: "1140+ పద్యాలు", color: ACCENTS[3] },
                { label: "AI ఆధారితం", color: ACCENTS[1] },
              ].map((s) => (
                <Chip
                  key={s.label}
                  label={s.label}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: `${s.color}14`, color: s.color, border: `1px solid ${s.color}33` }}
                />
              ))}
            </Stack>
          </Box>
        </Reveal>

        {/* ═══════════ 2. ABOUT THE PROJECT ═══════════ */}
        <Reveal delay={0.06}>
          <Card sx={{ mb: 3, borderLeft: `4px solid ${ACCENTS[2]}`, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <AssignmentTwoToneIcon sx={{ color: ACCENTS[2], fontSize: "1.3rem" }} />
                <Typography fontWeight={700} sx={{ color: "#1E293B" }}>
                  ప్రాజెక్ట్ గురించి
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "0.95rem", color: "#1E293B", lineHeight: 1.75 }}>
                రత్నాలబాల – జ్ఞానమాల ఒక ఉచిత, వాణిజ్యేతర హాబీ ప్రాజెక్ట్ , తెలుగు పద్యాలు, శతకాలు, కథలు, సామెతలు వంటి
                సాహిత్య సంపదను ఆధునిక సాంకేతికత (AI, వాయిస్, OCR) సాయంతో అందరికీ సులభంగా చదవడానికి, వినడానికి,
                నేర్చుకోవడానికి వీలుగా ఒకే వేదికపైకి తెచ్చే ప్రయత్నం.
              </Typography>
            </CardContent>
          </Card>
        </Reveal>

        {/* ═══════════ 3. TELUGU SAMPLE VERSE ═══════════ */}
        <Reveal delay={0.12}>
          <Card sx={{ mb: 3, borderLeft: `4px solid ${ACCENTS[3]}`, borderRadius: 3 }}>
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2, color: "#1E293B" }}>
                తెలుగు అక్షరమాల పద్యం
              </Typography>
              <Typography sx={{ lineHeight: 1.8, fontSize: "0.95rem", whiteSpace: "pre-line", color: "#1E293B" }}>
                {`అమిత యశస్క ఆద్యయన ఇద్రుచి ఈశ్వర ఉగ్ర ఊర్జిత
      క్రమ ఋషభాంక ౠజిహర ఌస్తిత ౡస్మిత ఏకరుద్ర ఐం
      ద్రమహిత రూప ఓమితి పదద్యుతి ఔర్వ లలాట అంబికా
      సమరసభావ అఃకలిత వర్ణనుతం బసవేశ పాహిమాం!!`}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontSize: "0.85rem", color: MUTED_TEXT }}>– పాల్కురికి సోమన</Typography>
            </CardContent>
          </Card>
        </Reveal>

        {/* ═══════════ NEW: RADIO + BULK DOWNLOAD TOOLS — placed right
            after the sample verse, as requested. Loading/error states
            mirror the pattern used on the poem list pages, since this
            page now fetches its own poems. ═══════════ */}
        {loading && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
            <CircularProgress size={28} />
            <Typography sx={{ fontSize: "0.85rem", color: MUTED_TEXT }}>
              పద్యాలు లోడ్ అవుతున్నాయి…
            </Typography>
          </Stack>
        )}

        {error && (
          <Typography align="center" color="error" sx={{ py: 3, fontSize: "0.9rem" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && poems.length > 0 && (
          <Reveal delay={0.16}>
            <Box sx={{ textAlign: "center", mb: 1.5 }}>
              <Typography fontWeight={800} sx={{ fontSize: "1rem", color: "#1E293B" }}>
                🎧 స్వరమాల రేడియో
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: MUTED_TEXT }}>
                ఒక్క బటన్‌తో, మీ స్వరం ఎంచుకుని అన్ని పద్యాలు వరుసగా వినండి — సొంత రేడియో స్టేషన్‌లా.
              </Typography>
            </Box>
            <PoemRadio poems={poems} />
          </Reveal>
        )}

        {!loading && !error && poems.length > 0 && (
          <Reveal delay={0.2}>
            <Box sx={{ mb: 3 }}>
              <Button
                onClick={() => setToolsOpen((v) => !v)}
                variant="outlined"
                fullWidth
                startIcon={<DownloadForOfflineRoundedIcon fontSize="small" />}
                endIcon={
                  toolsOpen ? (
                    <ExpandLessRoundedIcon fontSize="small" />
                  ) : (
                    <ExpandMoreRoundedIcon fontSize="small" />
                  )
                }
                sx={{
                  textTransform: "none", fontWeight: 700, borderRadius: "10px",
                  borderColor: `${ACCENTS[0]}55`, color: ACCENTS[0],
                  "&:hover": { borderColor: ACCENTS[0], bgcolor: `${ACCENTS[0]}0A` },
                }}
              >
               సంచయమాల (పోస్టర్లు · వాయిస్‌లు · వీడియోలు)
              </Button>

              <Collapse in={toolsOpen} timeout={280} unmountOnExit>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <DownloadAllPosters poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                  <DownloadAllVideos poems={poems} />
                  <DownloadAllVoices poems={poems} />
                </Stack>
              </Collapse>
            </Box>
          </Reveal>
        )}

        <SectionDivider Icon={MenuBookTwoToneIcon} color={ACCENTS[0]} />

        {/* ═══════════ 4. MALAS / MODULE GRID ═══════════ */}
        <Reveal delay={0.26}>
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {ALL_MODULE_ITEMS.map((item) => (
                <Box
                  key={item.label}
                  component={Link}
                  href={item.path}
                  sx={{
                    textDecoration: "none", display: "block", position: "relative",
                    borderRadius: 3, p: 1.75, bgcolor: "#fff", border: "1px solid",
                    borderColor: "divider", borderLeft: `4px solid ${item.color}`,
                    overflow: "hidden", transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 20px ${item.color}2E` },
                    "&:focus-visible": { outline: `3px solid ${item.color}`, outlineOffset: "2px" },
                    "&::after": {
                      content: '""', position: "absolute", top: 0, left: "-60%", width: "40%", height: "100%",
                      background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent)",
                      transform: "skewX(-20deg)", transition: "left 0.55s ease", pointerEvents: "none",
                    },
                    "&:hover::after": { left: "130%" },
                    ...reducedMotionOff,
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <IconBadge Icon={item.Icon} color={item.color} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B" }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.3, color: MUTED_TEXT, lineHeight: 1.4 }}>
                        {item.intro}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>

        <SectionDivider Icon={CheckCircleTwoToneIcon} color={ACCENTS[1]} />

        {/* ═══════════ 5. REMAINING — Agent Spotlight, What You Can Do,
            About the Voices ═══════════ */}
        <Reveal delay={0.32}>
          <Box
            sx={{
              mb: 4, p: { xs: 2.5, md: 3 }, borderRadius: 4, textAlign: "center",
              background: `linear-gradient(135deg, ${ACCENTS[0]} 0%, ${ACCENTS[1]} 50%, ${ACCENTS[4]} 100%)`,
              boxShadow: "0 8px 26px rgba(20,83,45,0.28)", position: "relative", overflow: "hidden",
              "@keyframes glowPulse": {
                "0%,100%": { boxShadow: "0 8px 26px rgba(20,83,45,0.28)" },
                "50%": { boxShadow: "0 8px 36px rgba(107,33,168,0.4)" },
              },
              animation: "glowPulse 3.2s ease-in-out infinite",
              ...reducedMotionOff,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  display: "flex", animation: "bounce 1.8s ease-in-out infinite",
                  "@keyframes bounce": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
                  ...reducedMotionOff,
                }}
              >
                <SmartToyTwoToneIcon sx={{ color: "#fff", fontSize: "1.4rem" }} />
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.15rem", md: "1.35rem" }, color: "#fff" }}>
                ఈరోజు నిర్ణయాత్మక మాల ఎంచుకున్న పద్యం.
              </Typography>
            </Stack>

            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.88rem", mb: 2 }}>
              1140+ పద్యాలలో నుండి — ఒక్క క్లిక్‌తో మీ కోసం ఎంపిక
            </Typography>

            <Box sx={{ bgcolor: "#fff", borderRadius: 3, p: { xs: 1.5, md: 2 } }}>
              <AgentPoemButton />
            </Box>
          </Box>
        </Reveal>

        <Reveal delay={0.38}>
          <Box sx={{ p: { xs: 2, md: 2.5 }, mb: 2, borderRadius: 3, bgcolor: "#fff", border: "1px solid #e5e7eb", textAlign: "center" }}>
            <Typography fontWeight={800} sx={{ mb: 1.5, color: "#1E293B" }}>
              మీరు ఇక్కడ చేయగలవి
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
              {actionChips.map((action, i) => {
                const color = ACCENTS[i % ACCENTS.length];
                return (
                  <Chip
                    key={action}
                    label={action}
                    sx={{
                      fontWeight: 600, bgcolor: `${color}14`, color, border: `1px solid ${color}33`,
                      transition: "transform 0.15s ease", "&:hover": { transform: "scale(1.06)" },
                      "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: "2px" },
                      ...reducedMotionOff,
                    }}
                  />
                );
              })}
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
              <LockTwoToneIcon sx={{ fontSize: "0.95rem", color: MUTED_TEXT }} />
              <Typography sx={{ fontSize: "0.8rem", color: MUTED_TEXT }}>
                మీ గోప్యతే మా మొదటి ప్రాధాన్యత.
              </Typography>
            </Stack>
          </Box>
        </Reveal>

        <Reveal delay={0.44}>
          <Card sx={{ mb: 3, borderLeft: `4px solid ${ACCENTS[0]}`, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <VolumeUpTwoToneIcon sx={{ color: ACCENTS[0], fontSize: "1.3rem" }} />
                <Typography fontWeight={700} sx={{ color: "#1E293B" }}>
                  స్వరాల గురించి
                </Typography>
              </Stack>

              <Box sx={{ mb: 2 }}>
                <Typography fontWeight={700} sx={{ fontSize: "0.95rem", color: "#1E293B", mb: 0.5 }}>
                  మగ / స్త్రీ స్వరం
                </Typography>
                <Typography sx={{ fontSize: "0.9rem", color: "#1E293B", mb: 0.5, lineHeight: 1.7 }}>
                  Microsoft కంపెనీ తయారుచేసిన AI వాయిసులు (Mohan & Shruti). ఈ స్వరాలను మీరే ఇక్కడ
                  వినవచ్చు:
                </Typography>
                <Typography
                  component="a"
                  href="https://speech.microsoft.com/portal/voicegallery"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: "0.88rem", color: ACCENTS[1], textDecoration: "underline",
                    "&:focus-visible": { outline: `2px solid ${ACCENTS[1]}`, outlineOffset: "2px" },
                  }}
                >
                  speech.microsoft.com/portal/voicegallery
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography fontWeight={700} sx={{ fontSize: "0.95rem", color: "#1E293B", mb: 0.5 }}>
                  Google TTS
                </Typography>
                <Typography sx={{ fontSize: "0.9rem", color: "#1E293B", mb: 0.5, lineHeight: 1.7 }}>
                  Google Translate ‌లో మీరు వినే అదే స్వరం.
                </Typography>
                <Typography
                  component="a"
                  href="https://translate.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: "0.88rem", color: ACCENTS[1], textDecoration: "underline",
                    "&:focus-visible": { outline: `2px solid ${ACCENTS[1]}`, outlineOffset: "2px" },
                  }}
                >
                  translate.google.com
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Reveal>
      </Container>
    </Box>
  );
}