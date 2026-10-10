/* ═══════════════════════════════════════════════════════════════
   మాలల జాబితా — ఒకే చోట (Navbar, ముఖ పేజీ రెండూ ఇదే వాడతాయి)

   కొత్త మాల చేర్చాలా / పేరు మార్చాలా? ఇక్కడ మాత్రమే మార్చండి.
   3 గుంపులు: వ్యాకరణం · సాహిత్యం · కళలు
   tone: "maroon" | "gold" | "ink" — globals.css లోని .is-maroon / .is-gold / .is-ink
   ═══════════════════════════════════════════════════════════════ */

import type { SvgIconComponent } from "@mui/icons-material";
import SpellcheckTwoToneIcon from "@mui/icons-material/SpellcheckTwoTone";
import MenuBookTwoToneIcon from "@mui/icons-material/MenuBookTwoTone";
import PaletteTwoToneIcon from "@mui/icons-material/PaletteTwoTone";
import AbcTwoToneIcon from "@mui/icons-material/AbcTwoTone";
import GraphicEqTwoToneIcon from "@mui/icons-material/GraphicEqTwoTone";
import TextFieldsTwoToneIcon from "@mui/icons-material/TextFieldsTwoTone";
import FormatQuoteTwoToneIcon from "@mui/icons-material/FormatQuoteTwoTone";
import JoinFullTwoToneIcon from "@mui/icons-material/JoinFullTwoTone";
import CallMergeTwoToneIcon from "@mui/icons-material/CallMergeTwoTone";
import AutoStoriesTwoToneIcon from "@mui/icons-material/AutoStoriesTwoTone";
import SelfImprovementTwoToneIcon from "@mui/icons-material/SelfImprovementTwoTone";
import ImportContactsTwoToneIcon from "@mui/icons-material/ImportContactsTwoTone";
import HistoryEduTwoToneIcon from "@mui/icons-material/HistoryEduTwoTone";
import ChromeReaderModeTwoToneIcon from "@mui/icons-material/ChromeReaderModeTwoTone";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
import TempleHinduTwoToneIcon from "@mui/icons-material/TempleHinduTwoTone";
import QuizTwoToneIcon from "@mui/icons-material/QuizTwoTone";
import BookmarkTwoToneIcon from "@mui/icons-material/BookmarkTwoTone";
import AppsTwoToneIcon from "@mui/icons-material/AppsTwoTone";
import FontDownloadTwoToneIcon from "@mui/icons-material/FontDownloadTwoTone";
import ImageTwoToneIcon from "@mui/icons-material/ImageTwoTone";
import MicTwoToneIcon from "@mui/icons-material/MicTwoTone";
import TranslateTwoToneIcon from "@mui/icons-material/TranslateTwoTone";
import VpnKeyTwoToneIcon from "@mui/icons-material/VpnKeyTwoTone";
import StyleTwoToneIcon from "@mui/icons-material/StyleTwoTone";
import NewspaperTwoToneIcon from "@mui/icons-material/NewspaperTwoTone";

export type Tone = "maroon" | "gold" | "ink";
export type Mala = { label: string; path: string; intro: string; Icon: SvgIconComponent; navLabel?: string };
export type MalaGroup = { label: string; emoji: string; tone: Tone; Icon: SvgIconComponent; items: Mala[] };

export const MALA_GROUPS: MalaGroup[] = [
  {
    label: "వ్యాకరణం",
    emoji: "📖",
    tone: "gold",
    Icon: SpellcheckTwoToneIcon,
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
    label: "సాహిత్యం",
    emoji: "📚",
    tone: "maroon",
    Icon: MenuBookTwoToneIcon,
    items: [
      { label: "పద్యాలమాల", path: "/poems", intro: "మిరియాల వెంకటరత్నం గారి పద్యాలు", Icon: AutoStoriesTwoToneIcon },
      { label: "మిరా", path: "/mirapoems", intro: "డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారి పద్యాలు", Icon: SelfImprovementTwoToneIcon },
      { label: "శతకాలమాల", path: "/shatakamu", intro: "ప్రసిద్ధ తెలుగు శతకాల సేకరణ", Icon: ImportContactsTwoToneIcon },
      { label: "స్మృతిమాల", path: "/smruthimala", intro: "జ్ఞాపకాలు, స్మారక పద్యాల సంకలనం", Icon: HistoryEduTwoToneIcon },
      { label: "కథామాల", path: "/kathamala", intro: "నీతికథలు, చిన్న కథల డిజిటల్ సంగ్రహం", Icon: ChromeReaderModeTwoToneIcon },
      { label: "పరాభవమాల", path: "/parabhava", intro: "ఉగాది శతకం: పరాభవ నామ సంవత్సర స్వాగతం", Icon: WbSunnyTwoToneIcon },
      { label: "గీతామాల", path: "/geeta", intro: "భగవద్గీత శ్లోకాలు — చదవండి, వినండి", Icon: TempleHinduTwoToneIcon },
      { label: "PDF ప్రశ్నోత్తరి", path: "/prashnottari", intro: "మీ తెలుగు PDF పై ప్రశ్నలు — జవాబు పేజీ సంఖ్యతో", Icon: QuizTwoToneIcon },
      { label: "నా చదువు", path: "/my-reading", intro: "మీరు చదివినవి, ఇష్టమైనవి ఒకే చోట", Icon: BookmarkTwoToneIcon },
      { label: "జ్ఞానమాల", navLabel: "జ్ఞానమాల — అన్ని మాలలు ఒకే చోట", path: "/gnanamala", intro: "అన్ని మాలలు ఒకే చోట", Icon: AppsTwoToneIcon },
    ],
  },
  {
    label: "కళలు",
    emoji: "🎨",
    tone: "ink",
    Icon: PaletteTwoToneIcon,
    items: [
      { label: "ఖతిమాల", path: "/khatiMala", intro: "ఉచిత ఆన్‌లైన్ తెలుగు ఎడిటర్ — PDF, Word, పోస్టర్, వీడియో", Icon: FontDownloadTwoToneIcon },
      { label: "చిత్రమాల", path: "/chitramala", intro: "పద్యాలను చిత్రాలుగా, పోస్టర్లుగా మార్చండి", Icon: ImageTwoToneIcon },
      { label: "స్వరమాల", path: "/swaramala", intro: "చదవండి, వినండి — తెలుగు స్వరాల అనుభవం", Icon: MicTwoToneIcon },
      { label: "లిపిమాల", path: "/lipimala", intro: "తెలుగు లిపుల పరిచయం, OCR తో రూపాంతరం", Icon: TranslateTwoToneIcon },
      { label: "విదురమాల", path: "/rahasyabhasha", intro: "రహస్య భాష శైలుల అన్వేషణ, అభ్యాసం", Icon: VpnKeyTwoToneIcon },
      { label: "శైలిమాల", path: "/shailimala", intro: "ఫాంట్లు, పుస్తకాలు, యాప్, రింగ్‌టోన్లు — ఉచితం", Icon: StyleTwoToneIcon },
      { label: "వాచకమాల", path: "/news", intro: "తెలుగు వార్తలు చదవండి, వినండి", Icon: NewspaperTwoToneIcon },
    ],
  },
];

export const MALA_COUNT = MALA_GROUPS.reduce((n, g) => n + g.items.length, 0);
export const toneClass = (t: Tone) => `is-${t}`;
