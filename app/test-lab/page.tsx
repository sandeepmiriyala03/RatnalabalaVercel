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

// NEW — functional tests for Aksharamala's actual API behavior, not
// just "does the page load." Each check hits a real endpoint and
// verifies the response shape/content, same pass/fail pattern as
// the page-load checks above.
type FunctionalCheck = {
  name: string;
  run: () => Promise<void>; // throws on failure, resolves on success
};

const AKSHARAMALA_FUNCTIONAL_CHECKS: FunctionalCheck[] = [
  {
    name: "అక్షరాల జాబితా లోడ్ అవుతుందా",
    run: async () => {
      const res = await fetch("/api/aksharamala?search=&type=all&page=1&page_size=100");
      if (!res.ok) throw new Error(`స్థితి: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("items ఖాళీగా వచ్చింది");
      }
    },
  },
  {
    name: "అచ్చులు ఫిల్టర్ సరిగ్గా పనిచేస్తుందా",
    run: async () => {
      const res = await fetch("/api/aksharamala?search=&type=swaralu&page=1&page_size=100");
      if (!res.ok) throw new Error(`స్థితి: ${res.status}`);
      const data = await res.json();
      const wrongType = (data.items || []).find((a: any) => a.type !== "swaralu");
      if (wrongType) throw new Error("వర్గం తప్పుగా ఫిల్టర్ అయ్యింది");
    },
  },
  {
    name: "సెర్చ్ + సామెతలు కలిపి పనిచేస్తుందా",
    run: async () => {
      const res = await fetch("/api/aksharamala?search=ఎలుక&type=all&page=1&page_size=100");
      if (!res.ok) throw new Error(`స్థితి: ${res.status}`);
      const data = await res.json();
      if (!("sametalu_matches" in data)) {
        throw new Error("sametalu_matches ఫీల్డ్ లేదు");
      }
    },
  },
  {
    name: "సంబంధిత అక్షరాలు (similar) పనిచేస్తుందా",
    run: async () => {
      const res = await fetch("/api/aksharamala_similar?letter=అ&word=అరటి");
      if (!res.ok) throw new Error(`స్థితి: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.same_type)) {
        throw new Error("same_type array రాలేదు");
      }
    },
  },
  {
    name: "ఉచ్చారణ తనిఖీ (సరైనది) పనిచేస్తుందా",
    run: async () => {
      const res = await fetch("/api/pronunciation_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_word: "టెస్ట్", spoken_text: "టెస్ట్" }),
      });
      if (!res.ok) throw new Error(`స్థితి: ${res.status}`);
      const data = await res.json();
      if (data.correct !== true) throw new Error("సరైన మ్యాచ్‌ని 'correct' గా గుర్తించలేదు");
    },
  },
  {
    name: "ఉచ్చారణ తనిఖీ (తప్పు) సరిగ్గా తిరస్కరిస్తుందా",
    run: async () => {
      const res = await fetch("/api/pronunciation_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_word: "అమ్మ", spoken_text: "పూర్తిగా వేరే పదం" }),
      });
      if (!res.ok) throw new Error(`స్థితి: ${res.status}`);
      const data = await res.json();
      if (data.correct !== false) throw new Error("తప్పు మ్యాచ్‌ని 'correct' గా చూపించింది");
    },
  },
];

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

  // NEW — functional test state, separate from page-load results
  // above (different key space, different meaning).
  const [funcResults, setFuncResults] = useState<Record<string, Result>>({});
  const [funcErrors, setFuncErrors] = useState<Record<string, string>>({});
  const [isRunningFunc, setIsRunningFunc] = useState(false);
  const funcPassed = Object.values(funcResults).filter((r) => r === "విజయం").length;
  const funcFailed = Object.values(funcResults).filter((r) => r === "విఫలం").length;

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

  // NEW — runs one functional check, hits the real API
  const runFunctionalCheck = async (check: FunctionalCheck) => {
    setFuncResults((current) => ({ ...current, [check.name]: "పరీక్షలో ఉంది" }));
    setFuncErrors((current) => {
      const next = { ...current };
      delete next[check.name];
      return next;
    });
    try {
      await check.run();
      setFuncResults((current) => ({ ...current, [check.name]: "విజయం" }));
    } catch (err) {
      setFuncResults((current) => ({ ...current, [check.name]: "విఫలం" }));
      setFuncErrors((current) => ({
        ...current,
        [check.name]: err instanceof Error ? err.message : "తెలియని ఎర్రర్",
      }));
    }
  };

  const runAllFunctionalChecks = async () => {
    setIsRunningFunc(true);
    setFuncResults({});
    setFuncErrors({});
    for (const check of AKSHARAMALA_FUNCTIONAL_CHECKS) await runFunctionalCheck(check);
    setIsRunningFunc(false);
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

        {/* NEW — Aksharamala functional test section, same visual
            pattern as above, but testing actual API behavior instead
            of just page load. */}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>అక్షరమాల ఫంక్షనల్ పరీక్షలు</Typography>
              <Typography variant="body2" color="text.secondary">
                {funcPassed} విజయవంతం · {funcFailed} విఫలం · {AKSHARAMALA_FUNCTIONAL_CHECKS.length} మొత్తం —
                అసలు API ప్రవర్తనను (సెర్చ్, ఫిల్టర్, ఉచ్చారణ తనిఖీ) ధృవీకరిస్తుంది, పేజీ లోడ్ మాత్రమే కాదు.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={runAllFunctionalChecks}
              disabled={isRunningFunc}
              startIcon={isRunningFunc ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {isRunningFunc ? "పరీక్షలు నడుస్తున్నాయి…" : "అన్ని ఫంక్షన్‌లను పరీక్షించండి"}
            </Button>
          </Stack>
          {isRunningFunc && <LinearProgress sx={{ mb: 2 }} />}

          <Stack spacing={1}>
            {AKSHARAMALA_FUNCTIONAL_CHECKS.map((check) => {
              const result = funcResults[check.name] ?? "సిద్ధం";
              const error = funcErrors[check.name];
              return (
                <Box key={check.name} sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography fontWeight={600}>{check.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={result} color={chipColor(result)} />
                      <Button
                        size="small"
                        onClick={() => runFunctionalCheck(check)}
                        disabled={isRunningFunc || result === "పరీక్షలో ఉంది"}
                      >
                        పరీక్షించండి
                      </Button>
                    </Stack>
                  </Stack>
                  {error && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                      {error}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Paper>
      </Stack>
      <iframe ref={frameRef} title="పేజీ పరీక్ష ఫ్రేమ్" hidden />
    </Box>
  );
}