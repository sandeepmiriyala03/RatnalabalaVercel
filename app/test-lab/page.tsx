"use client";

import { useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, LinearProgress,
  Paper, Stack, Typography,
} from "@mui/material";

type Result = "idle" | "running" | "passed" | "failed";

const pageCases = [
  ["Home", "/"], ["About author", "/AboutAuthor"], ["Aksharamala", "/aksharamala"],
  ["Chitramala", "/chitramala"], ["Dedication", "/Dedication"], ["Guninta", "/guninta"],
  ["Kathamala", "/kathamala"], ["KhatiMala", "/khatiMala"], ["Lipimala", "/lipimala"],
  ["Mira", "/mira"], ["Mira poems", "/mirapoems"], ["MIRIA Quiz", "/MIRIAQuiz"],
  ["Padalamala", "/padalamala"], ["Parabhava", "/parabhava"], ["Poems", "/poems"],
  ["Poem titles", "/PoemTitles"], ["Rahasya bhasha", "/rahasyabhasha"], ["Samasa", "/samasa"],
  ["Sametalu", "/sametalu"], ["Sandhi", "/sandhi"], ["Shailimala", "/shailimala"],
  ["Shatakamu", "/shatakamu"], ["Smruthimala", "/smruthimala"], ["Swaramala", "/swaramala"],
  ["Video", "/video"],
] as const;

const sharedComponents = [
  "Navbar and mobile navigation", "Font selection", "Audio player", "PWA install prompt",
  "Floating AI button and chatbot", "Client wrapper", "Footer", "Go-to-top button",
];

function statusColor(result: Result) {
  if (result === "passed") return "success";
  if (result === "failed") return "error";
  if (result === "running") return "warning";
  return "default";
}

export default function TestLabPage() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const total = pageCases.length;
  const passed = Object.values(results).filter((result) => result === "passed").length;
  const failed = Object.values(results).filter((result) => result === "failed").length;

  const runCase = async (path: string) => {
    setResults((current) => ({ ...current, [path]: "running" }));
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await new Promise<void>((resolve, reject) => {
        const frame = frameRef.current;
        if (!frame) return reject(new Error("Test frame is unavailable"));
        const timer = window.setTimeout(() => reject(new Error("Page did not load in time")), 15_000);
        frame.onload = () => {
          window.clearTimeout(timer);
          resolve();
        };
        frame.src = `${path}${path.includes("?") ? "&" : "?"}testLab=${Date.now()}`;
      });
      setResults((current) => ({ ...current, [path]: "passed" }));
    } catch {
      setResults((current) => ({ ...current, [path]: "failed" }));
    }
  };

  const runAll = async () => {
    setIsRunning(true);
    setResults({});
    for (const [, path] of pageCases) await runCase(path);
    setIsRunning(false);
  };

  return (
    <Box component="main" id="main-content" sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight={800}>Browser Test Lab</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Run a browser smoke test for every application page. Each test checks its HTTP response and then loads it in an isolated browser frame.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
            <Box>
              <Typography fontWeight={700}>{passed} passed · {failed} failed · {total} total</Typography>
              <Typography variant="body2" color="text.secondary">Shared layout components are exercised whenever a route loads.</Typography>
            </Box>
            <Button variant="contained" size="large" onClick={runAll} disabled={isRunning} startIcon={isRunning ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {isRunning ? "Running tests…" : "Run all browser tests"}
            </Button>
          </Stack>
          {isRunning && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>

        <Alert severity="info">This dashboard verifies page availability and browser rendering. Keep dedicated automated end-to-end tests for API responses and complex user workflows.</Alert>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Page test cases</Typography>
          <Stack spacing={1}>
            {pageCases.map(([name, path]) => (
              <Stack key={path} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box><Typography fontWeight={600}>{name}</Typography><Typography variant="body2" color="text.secondary">{path}</Typography></Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={results[path] ?? "idle"} color={statusColor(results[path] ?? "idle")} />
                  <Button size="small" onClick={() => runCase(path)} disabled={isRunning || results[path] === "running"}>Run</Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Shared component coverage</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>These components render through the global layout or the tested pages above.</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>{sharedComponents.map((name) => <Chip key={name} label={name} color="primary" variant="outlined" />)}</Stack>
        </Paper>
      </Stack>
      <iframe ref={frameRef} title="Browser test frame" hidden />
    </Box>
  );
}
