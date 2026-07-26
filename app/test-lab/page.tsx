"use client";

import { useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, LinearProgress,
  Paper, Stack, Typography,
} from "@mui/material";

type Result = "సిద్ధం" | "పరీక్షలో ఉంది" | "విజయం" | "విఫలం";

const pageCases = [
  ["ముఖ్య పేజీ", "/"], ["అక్షరమాల", "/aksharamala"],
  ["చిత్రమాల", "/chitramala"], ["గుణింతమాల", "/guninta"],
  ["కథామాల", "/kathamala"], ["ఖతీమాల", "/khatiMala"], ["లిపిమాల", "/lipimala"],
  ["మీరా", "/mira"], ["మీరా పద్యాలు", "/mirapoems"],
  ["పదాలమాల", "/padalamala"], ["పరాభవమాల", "/parabhava"], ["పద్యాలు", "/poems"],
  ["పద్య శీర్షికలు", "/PoemTitles"], ["రహస్య భాష", "/rahasyabhasha"], ["సమాసము", "/samasa"],
  ["సామెతలు", "/sametalu"], ["సంధి", "/sandhi"], ["శైలిమాల", "/shailimala"],
  ["శతకము", "/shatakamu"], ["స్మృతిమాల", "/smruthimala"], ["స్వరమాల", "/swaramala"],
] as const;

function chipColor(result: Result) {
  if (result === "విజయం") return "success";
  if (result === "విఫలం") return "error";
  if (result === "పరీక్షలో ఉంది") return "warning";
  return "default";
}

export default function TestLabPage() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const passed = Object.values(results).filter((result) => result === "విజయం").length;
  const failed = Object.values(results).filter((result) => result === "విఫలం").length;

  const runPageCheck = async (path: string) => {
    setResults((current) => ({ ...current, [path]: "పరీక్షలో ఉంది" }));
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`స్థితి: ${response.status}`);

      await new Promise<void>((resolve, reject) => {
        const frame = frameRef.current;
        if (!frame) return reject(new Error("పరీక్ష ఫ్రేమ్ అందుబాటులో లేదు"));
        const timer = window.setTimeout(() => reject(new Error("పేజీ సమయానికి లోడ్ కాలేదు")), 15_000);
        frame.onload = () => {
          window.clearTimeout(timer);
          resolve();
        };
        frame.src = `${path}${path.includes("?") ? "&" : "?"}browserCheck=${Date.now()}`;
      });
      setResults((current) => ({ ...current, [path]: "విజయం" }));
    } catch {
      setResults((current) => ({ ...current, [path]: "విఫలం" }));
    }
  };

  const runAllChecks = async () => {
    setIsRunning(true);
    setResults({});
    for (const [, path] of pageCases) await runPageCheck(path);
    setIsRunning(false);
  };

  return (
    <Box component="main" id="main-content" sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight={800}>బ్రౌజర్ పరీక్షల కేంద్రం</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            ప్రతి పేజీ పని చేస్తుందా అని ఇక్కడే పరీక్షించవచ్చు. ఒక పేజీని విడిగా లేదా అన్ని పేజీలను ఒకే క్లిక్‌తో పరీక్షించండి.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
            <Box>
              <Typography fontWeight={700}>{passed} విజయవంతం · {failed} విఫలం · {pageCases.length} మొత్తం</Typography>
              <Typography variant="body2" color="text.secondary">ప్రతి పరీక్ష పేజీ స్పందనను మరియు బ్రౌజర్ లోడింగ్‌ను ధృవీకరిస్తుంది.</Typography>
            </Box>
            <Button variant="contained" size="large" onClick={runAllChecks} disabled={isRunning} startIcon={isRunning ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {isRunning ? "పరీక్షలు నడుస్తున్నాయి…" : "అన్ని పేజీలను పరీక్షించండి"}
            </Button>
          </Stack>
          {isRunning && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>

        <Alert severity="info">ప్రతి పేజీకి ఎదురుగా ఉన్న <strong>పరీక్షించండి</strong> బటన్ ఆ పేజీని విడిగా పరీక్షిస్తుంది. ఈ పరీక్షలు పేజీ అందుబాటులో ఉందా, బ్రౌజర్‌లో లోడ్ అవుతుందా అని నిర్ధారిస్తాయి.</Alert>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>ఎలా ఉపయోగించాలి</Typography>
          <Stack component="ol" spacing={1} sx={{ my: 0, pl: 3 }}>
            <Typography component="li">అన్ని పేజీలను పరీక్షించడానికి <strong>అన్ని పేజీలను పరీక్షించండి</strong> బటన్ నొక్కండి.</Typography>
            <Typography component="li">విజయం అంటే పేజీ సరిగ్గా స్పందించి లోడ్ అయింది.</Typography>
            <Typography component="li">విఫలం కనిపిస్తే ఆ పేజీ లింక్‌ను తెరిచి సమస్యను పరిశీలించండి.</Typography>
            <Typography component="li">డెవలపర్‌ల కోసం ఇదే పేజీలకు ఆటోమేటెడ్ Playwright పరీక్షలు కూడా అందుబాటులో ఉన్నాయి.</Typography>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>పేజీ పరీక్షలు</Typography>
          <Stack spacing={1}>
            {pageCases.map(([name, path]) => {
              const result = results[path] ?? "సిద్ధం";
              return (
                <Stack key={path} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box><Typography fontWeight={600}>{name}</Typography><Typography variant="body2" color="text.secondary">{path}</Typography></Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={result} color={chipColor(result)} />
                    <Button size="small" onClick={() => runPageCheck(path)} disabled={isRunning || result === "పరీక్షలో ఉంది"}>పరీక్షించండి</Button>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      </Stack>
      <iframe ref={frameRef} title="పేజీ పరీక్ష ఫ్రేమ్" hidden />
    </Box>
  );
}
