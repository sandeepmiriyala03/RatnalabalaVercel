"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";

// ── Microsoft Edge TTS only — Google and Svara removed per request.
// browser-native kept as a bonus offline fallback (doesn't call any
// API at all, so it doesn't conflict with "Microsoft only").
type VoiceOption = "mohan" | "shruti" | "browser-native";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Microsoft Edge — Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Microsoft Edge — Shruti)",
  "browser-native": "📱 బ్రౌజర్ వాయిస్ (ఆఫ్‌లైన్)",
};

// Simplified resolver — every non-browser voice now maps to the same
// "edge" source; only the gender differs.
function resolveTtsParams(voice: VoiceOption): { source: "edge"; gender: "male" | "female" } {
  return { source: "edge", gender: voice === "shruti" ? "female" : "male" };
}

// Matches MAX_TEXT_LENGTH in the /api/tts route — the server hard-rejects
// anything longer, so this is enforced client-side too rather than
// letting the user hit a generic 400 with no warning beforehand.
const MAX_TEXT_LENGTH = 5000;

// Telugu Unicode block + ASCII digits + currency/percent/hyphen +
// sentence punctuation + Telugu danda marks + whitespace.
//
// FIX (carried over): digits (0-9) were originally missing here, which
// silently stripped every number out of news text ("23,44,396" -> gone)
// before it ever reached the TTS engine.
const TELUGU_SANITIZE_RE = /[^\u0C00-\u0C7F0-9₹%\-.?,!\u0964\u0965\s]/g;

function sanitizeTelugu(input: string): string {
  return input.replace(TELUGU_SANITIZE_RE, " ").replace(/\s+/g, " ").trim();
}

async function parseJsonSafe(res: Response): Promise<any> {
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      res.ok
        ? "సర్వర్ నుండి JSON కాకుండా వేరే రెస్పాన్స్ వచ్చింది."
        : `API రూట్ దొరకలేదు లేదా సర్వర్ ఎర్రర్ (status ${res.status}).`
    );
  }
}

// Validates that the input is an actual http/https URL before it's ever
// sent to the backend — catches the case where someone types a random
// word, a partial URL missing the scheme, or a non-http(s) scheme
// (e.g. "ftp://", "javascript:") instead of a real article link. Using
// the native URL constructor rather than a hand-rolled regex, since it
// correctly handles the full range of valid URL syntax without us
// having to reinvent that parsing.
function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Sample news for one-click testing.
// NOTE: this used to be called SAMPLE_NEWS; renamed to ADDITIONAL_NEWS
// to match lib/additionalNews.ts's export. The dropdown/loadSample code
// below now consistently references THIS name — that mismatch was the
// actual bug in the previous version (undefined SAMPLE_NEWS).
export const ADDITIONAL_NEWS: { label: string; text: string }[] = [
  {
    label: "దేవాలయం / హుండీ (సంఖ్యలు)",
    text:
      "శృంగార వల్లభ స్వామి హుండీ ఆదాయం లెక్కింపు\n\n" +
      "పెద్దాపురం: తొలి తిరుపతి శృంగారవల్లభ స్వామి వారి దేవస్థానంలో మంగళవారం హుండీ లెక్కింపు నిర్వహించారు. 85 రోజుల కాలానికి సాధారణ హుండీ ద్వారా రూ.23,44,396, అన్నదానం హుండీ ద్వారా రూ.6,02,957 కలసి మొత్తం రూ.29,47,353 ఆదాయం సమకూరినట్లు ఈవో వడ్డి శ్రీనివాసరావు తెలిపారు. వీటితో పాటు 0.143 గ్రాముల బంగారం, 0.711 గ్రాముల వెండి కానుకలుగా వచ్చినట్లు పేర్కొన్నారు. దేవాదాయ శాఖ జిల్లా అధికారి వి. వెంకటేశ్వరరావు, డివిజనల్ ఇన్‌స్పెక్టర్ ఫణీంద్ర కుమార్, కాజులూరు ఈవో సోమరాజు, ధర్మకర్తల మండలి చైర్మన్ మొయిళ్ల సంధ్య కృష్ణమూర్తి, ఆలయ అర్చకులు, బ్యాంకు సిబ్బంది పాల్గొన్నారు.",
  },
  {
    label: "క్రీడలు",
    text:
      "టీమిండియా విజయం\n\n" +
      "సచిన్ స్టేడియంలో జరిగిన మ్యాచ్‌లో టీమిండియా 7 వికెట్ల తేడాతో ఆస్ట్రేలియాపై విజయం సాధించింది. కెప్టెన్ రోహిత్ శర్మ 87 బంతుల్లో 102 పరుగులు చేసి మ్యాన్ ఆఫ్ ద మ్యాచ్ అవార్డు అందుకున్నాడు. బౌలింగ్‌లో బుమ్రా 4 వికెట్లు తీసి రాణించాడు. తదుపరి మ్యాచ్ శుక్రవారం జరుగనుంది.",
  },
  {
    label: "వాతావరణం",
    text:
      "రాష్ట్రంలో వర్ష సూచన\n\n" +
      "వచ్చే 48 గంటల్లో ఆంధ్రప్రదేశ్, తెలంగాణలో అనేక ప్రాంతాల్లో మోస్తరు నుంచి భారీ వర్షాలు కురిసే అవకాశం ఉందని వాతావరణ శాఖ తెలిపింది. కోస్తా జిల్లాల్లో ఉష్ణోగ్రతలు 2 నుంచి 3 డిగ్రీలు తగ్గే అవకాశం ఉంది. మత్స్యకారులు సముద్రంలోకి వెళ్లవద్దని హెచ్చరించారు.",
  },
  {
    label: "ఆర్థిక వార్తలు",
    text:
      "సెన్సెక్స్ లాభాల్లో ముగింపు\n\n" +
      "బుధవారం స్టాక్ మార్కెట్ లాభాల్లో ముగిసింది. సెన్సెక్స్ 412 పాయింట్లు పెరిగి 74,586 వద్ద, నిఫ్టీ 118 పాయింట్లు పెరిగి 22,610 వద్ద స్థిరపడింది. బ్యాంకింగ్, ఐటి రంగాల షేర్లు లాభపడ్డాయి. రూపాయి డాలర్‌తో పోలిస్తే 83.12కి బలపడింది.",
  },
  {
    label: "స్థానిక వార్తలు",
    text:
      "కొత్త రోడ్డు ప్రారంభం\n\n" +
      "జిల్లా కేంద్రంలో రూ.4.5 కోట్ల వ్యయంతో నిర్మించిన నాలుగు కిలోమీటర్ల రహదారిని మంత్రి ప్రారంభించారు. ఈ రహదారి వల్ల పరిసర గ్రామాల ప్రజలకు రవాణా సౌకర్యం మెరుగుపడుతుందని అధికారులు తెలిపారు. కార్యక్రమంలో స్థానిక ప్రజాప్రతినిధులు, అధికారులు పాల్గొన్నారు.",
  },
  {
    label: "సినిమా / వినోదం",
    text:
      "స్టార్ హీరో కొత్త సినిమా పూజా కార్యక్రమాలు ప్రారంభం\n\n" +
      "హైదరాబాద్: ప్రముఖ దర్శకుని కాంబినేషన్‌లో రాబోతున్న భారీ బడ్జెట్ సినిమా పూజా కార్యక్రమాలు ఈరోజు రామానాయుడు స్టూడియోస్‌లో వైభవంగా జరిగాయి. ముహూర్తపు షాట్‌కు ప్రముఖ నిర్మాత క్లాప్ కొట్టారు. వచ్చే నెల నుంచి రెగ్యులర్ షూటింగ్ ప్రారంభం కానుందని, వచ్చే ఏడాది సంక్రాంతికి సినిమాను విడుదల చేయడానికి ప్లాన్ చేస్తున్నామని చిత్ర బృందం తెలిపింది.",
  },
  {
    label: "విద్యా రంగాలు / ఉద్యోగాలు",
    text:
      "గ్రూప్-2 పరీక్షా తేదీలు విడుదల\n\n" +
      "అమరావతి: గ్రూప్-2 ఉద్యోగాల నియామకాలకు సంబంధించిన రాత పరీక్షల షెడ్యూల్‌ను పబ్లిక్ సర్వీస్ కమిషన్ విడుదల చేసింది. వచ్చే నెల 15వ తేదీ నుంచి పరీక్షలు నిర్వహించనున్నట్లు అధికారులు ప్రకటించారు. హాల్ టిక్కెట్లను పరీక్షకు వారం రోజుల ముందు నుంచి అధికారిక వెబ్‌సైట్ ద్వారా డౌన్‌లోడ్ చేసుకోవచ్చని తెలిపారు.",
  },
  {
    label: "సాంకేతికత (Technology)",
    text:
      "కొత్త ఏఐ ఫీచర్లను పరిచయం చేసిన టెక్ దిగ్గజం\n\n" +
      "బెంగళూరు: వినియోగదారుల సౌకర్యార్థం కృత్రిమ మేధ (AI) ఆధారిత కొత్త ఫీచర్లను ప్రముఖ టెక్ కంపెనీ నేడు ఆవిష్కరించింది. ఈ ఫీచర్ ద్వారా స్మార్ట్‌ఫోన్ వినియోగదారులు వాయిస్ కమాండ్స్‌తోనే సంక్లిష్టమైన పనులను తేలికగా పూర్తి చేయవచ్చు. ఈ అప్‌డేట్ వచ్చే వారం నుండి వినియోగదారులందరికీ అందుబాటులోకి రానుంది.",
  },
  {
    label: "ఆరోగ్యం / లైఫ్‌స్టైల్",
    text:
      "వేసవిలో వడదెబ్బ నుంచి రక్షణకు సూచనలు\n\n" +
      "విజయవాడ: రాష్ట్రంలో ఉష్ణోగ్రతలు పెరుగుతున్న నేపథ్యంలో ప్రజలు తగిన జాగ్రత్తలు తీసుకోవాలని ఆరోగ్య శాఖ అధికారులు సూచించారు. మధ్యాహ్నం 12 గంటల నుంచి 3 గంటల వరకు అత్యవసరమైతే తప్ప బయటకు రాకూడదని తెలిపారు. ద్రవాహారం, కొబ్బరి నీళ్ళు, మజ్జిగ ఎక్కువగా తీసుకోవాలని, డీహైడ్రేషన్ బారిన పడకుండా చూసుకోవాలని కోరారు.",
  },
  {
    label: "అంతర్జాతీయం",
    text:
      "గ్లోబల్ క్లైమేట్ సమ్మిట్‌లో కీలక నిర్ణయాలు\n\n" +
      "జెనీవా: పర్యావరణ మార్పులపై జరిగిన అంతర్జాతీయ సదస్సులో వివిధ దేశాల ప్రతినిధులు పాల్గొన్నారు. కార్బన్ ఉద్గారాలను తగ్గించడానికి మరియు పునరుత్పాదక ఇంధన వనరుల వినియోగాన్ని పెంచడానికి అన్ని దేశాలు సంయుక్తంగా కృషి చేయాలని నిర్ణయించాయి. దీని కోసం ప్రత్యేక నిధిని ఏర్పాటు చేయనున్నట్లు ప్రకటించాయి.",
  },
  {
    label: "రాజకీయాలు",
    text:
      "అసెంబ్లీలో కొత్త బిల్లుకు ఆమోదం\n\n" +
      "విజయవాడ: రాష్ట్ర శాసనసభలో ప్రవేశపెట్టిన వ్యవసాయ సంస్కరణల బిల్లుకు మెజారిటీ సభ్యుల మద్దతుతో ఆమోదం లభించింది. ఈ బిల్లు వల్ల 12 లక్షల మంది రైతులకు ప్రత్యక్ష ప్రయోజనం చేకూరుతుందని ప్రభుత్వం తెలిపింది. ప్రతిపక్షాలు కొన్ని సవరణలు కోరుతూ వాయిదా తీర్మానం ప్రవేశపెట్టినా, ఓటింగ్‌లో అది వీగిపోయింది.",
  },
  {
    label: "క్రీడలు — క్రికెట్",
    text:
      "రాష్ట్ర జట్టుకు షాకిచ్చిన గాయం వార్త\n\n" +
      "గుంటూరు: రంజీ ట్రోఫీ సీజన్‌కు ముందు రాష్ట్ర జట్టు కెప్టెన్‌కు తొడ కండరాల గాయం అయినట్లు జట్టు వైద్య బృందం ధృవీకరించింది. కనీసం 3 వారాల పాటు విశ్రాంతి తీసుకోవాలని సూచించారు. ఈ నేపథ్యంలో ఉపకెప్టెన్ తాత్కాలిక కెప్టెన్‌గా బాధ్యతలు చేపట్టనున్నారు.",
  },
  {
    label: "వ్యవసాయం",
    text:
      "పంట రుణాలపై వడ్డీ రాయితీ ప్రకటన\n\n" +
      "అమరావతి: ఖరీఫ్ సీజన్‌కు సంబంధించి రూ.1 లక్ష వరకు తీసుకున్న పంట రుణాలపై 4 శాతం వడ్డీ రాయితీని ప్రభుత్వం ప్రకటించింది. సకాలంలో రుణాలు చెల్లించిన రైతులకు మాత్రమే ఈ రాయితీ వర్తిస్తుందని వ్యవసాయ శాఖ మంత్రి తెలిపారు. సుమారు 18 లక్షల మంది రైతులు ఈ పథకం ద్వారా లబ్ధి పొందనున్నారు.",
  },
  {
    label: "నేరాలు / పోలీసు వార్తలు",
    text:
      "ఆన్‌లైన్ మోసంపై పోలీసుల హెచ్చరిక\n\n" +
      "విశాఖపట్నం: నకిలీ పెట్టుబడి యాప్‌ల ద్వారా ప్రజల నుంచి రూ.2.3 కోట్లు వసూలు చేసిన ముఠాను సైబర్ క్రైమ్ పోలీసులు అరెస్టు చేశారు. బాధితులు 340 మందికి పైగా ఉన్నట్లు గుర్తించారు. అపరిచిత లింకులపై క్లిక్ చేయవద్దని, అధిక రాబడి వాగ్దానం చేసే యాప్‌ల పట్ల జాగ్రత్తగా ఉండాలని పోలీసులు సూచించారు.",
  },
  {
    label: "వాతావరణం — తుఫాను హెచ్చరిక",
    text:
      "బంగాళాఖాతంలో అల్పపీడనం\n\n" +
      "విశాఖపట్నం: బంగాళాఖాతంలో ఏర్పడిన అల్పపీడనం వచ్చే 24 గంటల్లో వాయుగుండంగా బలపడే అవకాశం ఉందని వాతావరణ శాఖ తెలిపింది. తీర ప్రాంతాల్లో గంటకు 45 నుంచి 55 కిలోమీటర్ల వేగంతో ఈదురుగాలులు వీచే అవకాశం ఉంది. మత్స్యకారులు వచ్చే మూడు రోజులు సముద్రంలోకి వెళ్లవద్దని హెచ్చరించారు.",
  },
  {
    label: "వ్యాపారం / ఆర్థిక రంగం",
    text:
      "కొత్త పరిశ్రమకు రాష్ట్రం ఆహ్వానం\n\n" +
      "విశాఖపట్నం: రూ.5,600 కోట్ల పెట్టుబడితో ఏర్పాటు కానున్న ఎలక్ట్రానిక్స్ తయారీ యూనిట్‌కు రాష్ట్ర ప్రభుత్వం అనుమతులు మంజూరు చేసింది. ఈ యూనిట్ ద్వారా 8,000 మందికి ప్రత్యక్ష ఉపాధి లభించనుందని అధికారులు తెలిపారు. వచ్చే ఏడాది చివరి నాటికి ఉత్పత్తి ప్రారంభం కానుంది.",
  },
  {
    label: "దేవాలయం / ధార్మిక వార్తలు",
    text:
      "బ్రహ్మోత్సవాలకు భారీ ఏర్పాట్లు\n\n" +
      "తిరుపతి: వార్షిక బ్రహ్మోత్సవాలకు దేవస్థానం అధికారులు విస్తృత ఏర్పాట్లు చేపట్టారు. 9 రోజుల పాటు జరిగే ఈ ఉత్సవాలకు 10 లక్షల మందికి పైగా భక్తులు తరలివస్తారని అంచనా. రద్దీని దృష్టిలో ఉంచుకుని అదనంగా 200 క్యూ కౌంటర్లు ఏర్పాటు చేసినట్లు ఈవో తెలిపారు.",
  },
  {
    label: "స్థానిక వార్తలు — మున్సిపల్",
    text:
      "నగరంలో కొత్త మంచినీటి పథకం\n\n" +
      "విజయవాడ: నగర పరిధిలోని 15 వార్డులకు రూ.85 కోట్ల వ్యయంతో చేపట్టిన మంచినీటి సరఫరా పథకాన్ని మేయర్ ప్రారంభించారు. ఈ పథకం ద్వారా సుమారు 40,000 గృహాలకు రోజువారీ నీటి సరఫరా మెరుగుపడుతుందని అధికారులు తెలిపారు.",
  },
  {
    label: "రవాణా",
    text:
      "కొత్త బస్సు మార్గాలు ప్రారంభం\n\n" +
      "విజయవాడ: నగర శివారు ప్రాంతాలను కలుపుతూ ఆర్టీసీ 12 కొత్త బస్సు మార్గాలను ప్రారంభించింది. ఉదయం 5 గంటల నుంచి రాత్రి 11 గంటల వరకు ప్రతి 20 నిమిషాలకు ఒక బస్సు అందుబాటులో ఉంటుందని అధికారులు తెలిపారు. దీని వల్ల నిత్యం 25,000 మంది ప్రయాణికులకు ప్రయోజనం చేకూరనుంది.",
  },
  {
    label: "పర్యావరణం",
    text:
      "నదీ తీరంలో మొక్కల పెంపకం కార్యక్రమం\n\n" +
      "రాజమహేంద్రవరం: గోదావరి నదీ తీరంలో అటవీ శాఖ ఆధ్వర్యంలో భారీ మొక్కల పెంపకం కార్యక్రమం నిర్వహించారు. ఒక్క రోజులోనే 50,000 మొక్కలు నాటినట్లు అధికారులు తెలిపారు. వచ్చే మూడేళ్లలో 5 లక్షల మొక్కలు నాటాలని లక్ష్యంగా పెట్టుకున్నట్లు ప్రకటించారు.",
  },
  {
    label: "పండుగలు / సంస్కృతి",
    text:
      "సంక్రాంతి సంబరాలకు రాష్ట్రం సిద్ధం\n\n" +
      "విజయవాడ: రాష్ట్రవ్యాప్తంగా సంక్రాంతి పండుగను ఘనంగా జరుపుకునేందుకు ఏర్పాట్లు పూర్తయ్యాయి. గంగిరెద్దుల విన్యాసాలు, హరిదాసు కీర్తనలు, రంగవల్లుల పోటీలు మూడు రోజుల పాటు నిర్వహించనున్నారు. గ్రామీణ ప్రాంతాల్లో కోడి పందేలపై నిషేధం కొనసాగుతుందని పోలీసులు స్పష్టం చేశారు.",
  },
  {
    label: "రియల్ ఎస్టేట్",
    text:
      "గృహ నిర్మాణ రంగంలో వృద్ధి\n\n" +
      "హైదరాబాద్: గత ఆర్థిక సంవత్సరంతో పోలిస్తే నగరంలో అపార్ట్‌మెంట్ విక్రయాలు 18 శాతం పెరిగినట్లు రియల్ ఎస్టేట్ నివేదిక వెల్లడించింది. చదరపు అడుగు ధర సగటున రూ.6,200కి చేరుకుంది. వడ్డీ రేట్లు స్థిరంగా ఉండటం వల్ల గృహ కొనుగోలుదారుల సంఖ్య పెరిగిందని నిపుణులు అభిప్రాయపడ్డారు.",
  },
  {
    label: "బ్యాంకింగ్",
    text:
      "డిజిటల్ లావాదేవీలలో రికార్డు వృద్ధి\n\n" +
      "ముంబై: గత నెలలో దేశవ్యాప్తంగా యూపీఐ లావాదేవీలు 1,600 కోట్లు దాటాయని రిజర్వ్ బ్యాంక్ నివేదిక తెలిపింది. మొత్తం లావాదేవీల విలువ రూ.22 లక్షల కోట్లకు చేరుకుంది. గ్రామీణ ప్రాంతాల్లో సైతం డిజిటల్ చెల్లింపులు వేగంగా పెరుగుతున్నట్లు గణాంకాలు వెల్లడించాయి.",
  },
  {
    label: "పర్యాటకం",
    text:
      "కొండప్రాంత పర్యాటక కేంద్రానికి పెరిగిన ఆదరణ\n\n" +
      "అరకు: శీతాకాలం ప్రారంభం కావడంతో అరకు లోయకు పర్యాటకుల తాకిడి పెరిగింది. గత వారాంతంలో మాత్రమే 22,000 మందికి పైగా సందర్శకులు వచ్చినట్లు పర్యాటక శాఖ తెలిపింది. కాఫీ తోటలు, జలపాతాలు చూసేందుకు ప్రత్యేక ప్యాకేజీలను ప్రవేశపెట్టినట్లు అధికారులు వెల్లడించారు.",
  },
  {
    label: "మహిళా, శిశు సంక్షేమం",
    text:
      "బాలికల విద్యకు ప్రోత్సాహక పథకం\n\n" +
      "అమరావతి: ప్రభుత్వ పాఠశాలల్లో చదివే బాలికలకు ఏటా రూ.15,000 ప్రోత్సాహకం అందించే కొత్త పథకాన్ని ప్రభుత్వం ప్రకటించింది. ఈ పథకం ద్వారా 6 లక్షల మంది విద్యార్థినులు లబ్ధి పొందనున్నారని మహిళా శిశు సంక్షేమ శాఖ మంత్రి తెలిపారు.",
  },
  {
    label: "ఎన్నికలు",
    text:
      "స్థానిక సంస్థల ఎన్నికల షెడ్యూల్ విడుదల\n\n" +
      "అమరావతి: గ్రామ పంచాయతీ ఎన్నికల నోటిఫికేషన్‌ను రాష్ట్ర ఎన్నికల సంఘం విడుదల చేసింది. నామినేషన్ల స్వీకరణ వచ్చే వారం నుంచి ప్రారంభమవుతుందని, పోలింగ్ మూడు దశల్లో నిర్వహించనున్నట్లు తెలిపారు. మొత్తం 12,800 గ్రామ పంచాయతీలకు ఎన్నికలు జరుగనున్నాయి.",
  },
  {
    label: "న్యాయస్థానం",
    text:
      "హైకోర్టు కీలక తీర్పు\n\n" +
      "అమరావతి: భూ వివాదానికి సంబంధించిన కేసులో హైకోర్టు కీలక తీర్పు వెలువరించింది. దరఖాస్తుదారుల పిటిషన్‌ను కొట్టివేస్తూ, గత ఉత్తర్వులను సమర్థించింది. ఈ తీర్పుతో సుమారు 200 ఎకరాల భూమికి సంబంధించిన వివాదం పరిష్కారమైనట్లు న్యాయ నిపుణులు తెలిపారు.",
  },
  {
    label: "ప్రమాదాలు",
    text:
      "జాతీయ రహదారిపై రోడ్డు ప్రమాదం\n\n" +
      "గుంటూరు: జాతీయ రహదారిపై రెండు వాహనాలు ఢీకొనడంతో ఐదుగురు స్వల్పంగా గాయపడ్డారు. క్షతగాత్రులను వెంటనే సమీప ఆసుపత్రికి తరలించారు. పొగమంచు కారణంగా విజిబిలిటీ తగ్గడం వల్లే ప్రమాదం జరిగి ఉండవచ్చని పోలీసులు అనుమానం వ్యక్తం చేశారు. వాహనదారులు వేగ నియంత్రణ పాటించాలని సూచించారు.",
  },
  {
    label: "అవార్డులు / విజయాలు",
    text:
      "అంతర్జాతీయ పోటీలో రాష్ట్ర విద్యార్థికి పతకం\n\n" +
      "విజయవాడ: అంతర్జాతీయ గణిత ఒలింపియాడ్‌లో రాష్ట్రానికి చెందిన విద్యార్థి రజత పతకం సాధించాడు. 45 దేశాల నుంచి 300 మందికి పైగా విద్యార్థులు ఈ పోటీలో పాల్గొన్నారు. విద్యార్థి కృషిని అభినందిస్తూ ముఖ్యమంత్రి ప్రత్యేక అభినందనలు తెలిపారు.",
  },
  {
    label: "స్టార్టప్ / వ్యాపార ప్రారంభం",
    text:
      "యువ పారిశ్రామికవేత్తకు రూ.10 కోట్ల నిధులు\n\n" +
      "హైదరాబాద్: వ్యవసాయ సాంకేతికతపై పనిచేస్తున్న స్థానిక స్టార్టప్‌కు వెంచర్ క్యాపిటల్ సంస్థల నుంచి రూ.10 కోట్ల నిధులు లభించాయి. ఈ నిధులతో సంస్థ కొత్త ఉత్పత్తులను అభివృద్ధి చేయనుంది. ప్రస్తుతం ఈ స్టార్టప్ 3 రాష్ట్రాల్లో 5,000 మందికి పైగా రైతులకు సేవలు అందిస్తోంది.",
  },
];

export default function TeluguNewsReader() {
  const [rawText, setRawText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [voice, setVoice] = useState<VoiceOption>("shruti");
  const [speed, setSpeed] = useState(1.0);

  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserVoiceWarning, setBrowserVoiceWarning] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanText = sanitizeTelugu(rawText);
  const isBrowserVoice = voice === "browser-native";
  const isOverLimit = cleanText.length > MAX_TEXT_LENGTH;
  const busy = fetchingUrl || synthesizing || downloading;

  /* ───────── sample news picker ───────── */
  const loadSample = (label: string) => {
    const sample = ADDITIONAL_NEWS.find((s) => s.label === label);
    if (!sample) return;
    setSelectedSample(label);
    setRawText(sample.text);
    setError(null);
  };

  /* ───────── URL fetch ───────── */
  const handleFetchUrl = async () => {
    const trimmedUrl = articleUrl.trim();
    if (!trimmedUrl) return;

    if (!isValidHttpUrl(trimmedUrl)) {
      setError(
        "ఇది సరైన URL కాదు — లింక్ తప్పనిసరిగా http:// లేదా https:// తో మొదలవ్వాలి (ఉదా: https://www.eenadu.net/...)."
      );
      return;
    }

    setFetchingUrl(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.detail || data.error || "ఆర్టికల్ తీసుకురాలేకపోయాం.");
      setSelectedSample("");
      setRawText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
    } catch (e: any) {
      setError(e.message || "ఆర్టికల్ తీసుకురాలేకపోయాం.");
    } finally {
      setFetchingUrl(false);
    }
  };

  /* ───────── canvas visualizer ───────── */
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(data);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const step = Math.max(1, Math.floor(bufferLength / barCount));
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = data[i * step] || 0;
        const barHeight = (value / 255) * height;
        ctx.fillStyle = `hsl(${210 + (value / 255) * 60}, 90%, 55%)`;
        ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
      }
    };

    render();
  }, []);

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const setupVisualizer = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    }

    if (ctx.state === "suspended") ctx.resume();
    drawVisualizer();
  }, [drawVisualizer]);

  /* ───────── synthesize via the shared /api/tts contract ───────── */
  const synthesize = async (): Promise<Blob | null> => {
    if (!cleanText) {
      setError("దయచేసి తెలుగు టెక్స్ట్ నమోదు చేయండి.");
      return null;
    }
    if (isOverLimit) {
      setError(`టెక్స్ట్ చాలా పొడవుగా ఉంది — గరిష్టం ${MAX_TEXT_LENGTH} అక్షరాలు (ప్రస్తుతం ${cleanText.length}).`);
      return null;
    }

    const requestId = ++requestIdRef.current;
    const { source, gender } = resolveTtsParams(voice);

    setSynthesizing(true);
    setError(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, source, voice: gender }),
      });

      if (requestId !== requestIdRef.current) return null;

      if (!res.ok) {
        const data = await parseJsonSafe(res).catch(() => ({}));
        throw new Error(data.error || "వాయిస్ తయారు కాలేదు.");
      }

      const blob = await res.blob();
      if (requestId !== requestIdRef.current) return null;

      audioBlobRef.current = blob;
      return blob;
    } catch (e: any) {
      if (requestId === requestIdRef.current) {
        setError(e.message || "వాయిస్ తయారు కాలేదు.");
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setSynthesizing(false);
    }
  };

  /* ───────── play / pause ───────── */
  const handlePlay = async () => {
    if (isBrowserVoice) {
      if (playing) {
        window.speechSynthesis.cancel();
        setPlaying(false);
        return;
      }
      if (!cleanText) {
        setError("దయచేసి తెలుగు టెక్స్ట్ నమోదు చేయండి.");
        return;
      }
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = "te-IN";
      utter.rate = speed;
      utter.onend = () => setPlaying(false);
      utter.onerror = () => {
        setPlaying(false);
        setError("బ్రౌజర్ వాయిస్ ప్లే కాలేదు — పైన ఉన్న గమనిక చూడండి.");
      };
      window.speechSynthesis.speak(utter);
      setPlaying(true);
      return;
    }

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    if (audioUrlRef.current && audioRef.current) {
      setupVisualizer();
      await audioRef.current.play();
      setPlaying(true);
      return;
    }

    const blob = await synthesize();
    if (!blob || !audioRef.current) return;

    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = URL.createObjectURL(blob);
    audioRef.current.src = audioUrlRef.current;

    setupVisualizer();
    await audioRef.current.play();
    setPlaying(true);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      setPlaying(false);
      stopVisualizer();
    };
    const onPause = () => stopVisualizer();
    el.addEventListener("ended", onEnded);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  // Shared reset used whenever EITHER the voice OR the text changes —
  // fixes the bug where switching sample news / editing text still
  // replayed audio synthesized for the PREVIOUS text.
  const resetPlayback = useCallback(() => {
    requestIdRef.current += 1;

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      audioBlobRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
    }
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    setPlaying(false);
    setSynthesizing(false);
    stopVisualizer();
  }, []);

  useEffect(() => {
    resetPlayback();
    setError(null);

    if (voice === "browser-native" && typeof window !== "undefined" && "speechSynthesis" in window) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const hasTelugu = voices.some((v) => v.lang?.toLowerCase().startsWith("te"));
        setBrowserVoiceWarning(
          hasTelugu
            ? null
            : "మీ పరికరంలో తెలుగు బ్రౌజర్ వాయిస్ ఇన్‌స్టాల్ చేయబడలేదు — వేరే వాయిస్ ఎంచుకోండి లేదా OS సెట్టింగ్స్‌లో తెలుగు వాయిస్ జోడించండి."
        );
      };
      checkVoices();
      window.speechSynthesis.onvoiceschanged = checkVoices;
    } else {
      setBrowserVoiceWarning(null);
    }
  }, [voice, resetPlayback]);

  useEffect(() => {
    resetPlayback();
  }, [cleanText, resetPlayback]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ───────── download mp3 ───────── */
  const handleDownload = async () => {
    if (isBrowserVoice) {
      setError("బ్రౌజర్ వాయిస్‌ను MP3‌గా డౌన్‌లోడ్ చేయలేం — వేరే వాయిస్ ఎంచుకోండి.");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const blob = audioBlobRef.current || (await synthesize());
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      a.href = url;
      a.download = `telugu_news_${stamp}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const charCount = cleanText.length;

  return (
    <Card elevation={6} sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          తెలుగు న్యూస్ రీడర్ 📰🔊
        </Typography>

        {/* sample news — dropdown, one-click test data, no typing needed */}
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel>నమూనా వార్త ఎంచుకోండి</InputLabel>
          <Select
            label="నమూనా వార్త ఎంచుకోండి"
            value={selectedSample}
            onChange={(e) => loadSample(e.target.value as string)}
            disabled={busy}
            startAdornment={<ArticleRoundedIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />}
          >
            {ADDITIONAL_NEWS.map((sample) => (
              <MenuItem key={sample.label} value={sample.label}>
                {sample.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* URL fetch */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="న్యూస్ ఆర్టికల్ లింక్ పేస్ట్ చేయండి… (https://... తో మొదలవ్వాలి)"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            error={articleUrl.trim().length > 0 && !isValidHttpUrl(articleUrl)}
          />
          <Button
            variant="outlined"
            startIcon={fetchingUrl ? <CircularProgress size={16} /> : <LinkRoundedIcon />}
            onClick={handleFetchUrl}
            disabled={busy || !articleUrl.trim() || !isValidHttpUrl(articleUrl)}
            sx={{ whiteSpace: "nowrap" }}
          >
            తీసుకురా
          </Button>
        </Stack>
        {articleUrl.trim().length > 0 && !isValidHttpUrl(articleUrl) && (
          <Typography variant="caption" sx={{ color: "error.main", display: "block", mb: 1.5 }}>
            సరైన లింక్ కాదు — http:// లేదా https:// తో మొదలవ్వాలి.
          </Typography>
        )}
        {!(articleUrl.trim().length > 0 && !isValidHttpUrl(articleUrl)) && <Box sx={{ mb: 2 }} />}

        {/* text box */}
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={14}
          placeholder="ఇక్కడ న్యూస్ ఆర్టికల్ పేస్ట్ చేయండి లేదా టైప్ చేయండి… లేదా పైన ఒక నమూనా వార్తను ఎంచుకోండి."
          value={rawText}
          onChange={(e) => {
            setSelectedSample("");
            setRawText(e.target.value);
          }}
          sx={{ mb: 1 }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" color={isOverLimit ? "error.main" : "text.secondary"}>
            {charCount} / {MAX_TEXT_LENGTH} అక్షరాలు (శుద్ధి చేసిన తెలుగు టెక్స్ట్ — సంఖ్యలతో సహా)
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedSample("");
              setRawText("");
            }}
            disabled={!rawText || busy}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {error && (
          <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>
            {error}
          </Typography>
        )}

        {browserVoiceWarning && (
          <Typography variant="body2" sx={{ color: "warning.main", mb: 2 }}>
            {browserVoiceWarning}
          </Typography>
        )}

        {/* selected voice/language indicator */}
        <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
          <Chip
            label={`ఎంచుకున్నది: ${VOICE_LABELS[voice]}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* voice + speed */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>వాయిస్</InputLabel>
            <Select
              label="వాయిస్"
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceOption)}
            >
              {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                <MenuItem key={v} value={v}>
                  {VOICE_LABELS[v]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ width: "100%", px: { sm: 1 } }}>
            <Typography variant="caption" color="text.secondary">
              వేగం: {speed.toFixed(2)}x
            </Typography>
            <Slider
              size="small"
              value={speed}
              min={0.5}
              max={2.0}
              step={0.05}
              onChange={(_, v) => setSpeed(v as number)}
            />
          </Box>
        </Stack>

        {(synthesizing || downloading) && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

        {/* visualizer */}
        <Box
          sx={{
            bgcolor: "#0f172a",
            borderRadius: 2,
            p: 1,
            mb: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={80}
            style={{ width: "100%", maxWidth: 480 }}
          />
        </Box>

        {/* controls */}
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <IconButton
            onClick={handlePlay}
            disabled={synthesizing || !cleanText || isOverLimit}
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              width: 60,
              height: 60,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {synthesizing ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : playing ? (
              <PauseRoundedIcon />
            ) : (
              <PlayArrowRoundedIcon />
            )}
          </IconButton>

          <Button
            variant="outlined"
            startIcon={downloading ? <CircularProgress size={16} /> : <DownloadRoundedIcon />}
            onClick={handleDownload}
            disabled={downloading || !cleanText || isOverLimit || isBrowserVoice}
          >
            MP3 డౌన్‌లోడ్
          </Button>
        </Stack>

        {isBrowserVoice && !browserVoiceWarning && (
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            sx={{ mt: 1.5, color: "text.secondary" }}
          >
            బ్రౌజర్ వాయిస్ ఆఫ్‌లైన్‌లో పని చేస్తుంది కానీ MP3‌గా డౌన్‌లోడ్ చేయలేం.
          </Typography>
        )}

        <audio ref={audioRef} style={{ display: "none" }} />
      </CardContent>
    </Card>
  );
}