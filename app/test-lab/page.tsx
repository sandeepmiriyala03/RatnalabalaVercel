import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

const pageCases = [
  ["ముఖ్య పేజీ", "/"], ["రచయిత గురించి", "/AboutAuthor"], ["అక్షరమాల", "/aksharamala"],
  ["చిత్రమాల", "/chitramala"], ["అంకితం", "/Dedication"], ["గుణింతమాల", "/guninta"],
  ["కథామాల", "/kathamala"], ["ఖతీమాల", "/khatiMala"], ["లిపిమాల", "/lipimala"],
  ["మీరా", "/mira"], ["మీరా పద్యాలు", "/mirapoems"], ["మిరియా ప్రశ్నోత్తరాలు", "/MIRIAQuiz"],
  ["పదాలమాల", "/padalamala"], ["పరాభవమాల", "/parabhava"], ["పద్యాలు", "/poems"],
  ["పద్య శీర్షికలు", "/PoemTitles"], ["రహస్య భాష", "/rahasyabhasha"], ["సమాసము", "/samasa"],
  ["సామెతలు", "/sametalu"], ["సంధి", "/sandhi"], ["శైలిమాల", "/shailimala"],
  ["శతకము", "/shatakamu"], ["స్మృతిమాల", "/smruthimala"], ["స్వరమాల", "/swaramala"],
  ["వీడియో", "/video"],
] as const;

const sharedComponents = [
  "నావిగేషన్ పట్టీ మరియు మొబైల్ నావిగేషన్", "ఫాంట్ ఎంపిక", "ఆడియో ప్లేయర్", "PWA ఇన్‌స్టాల్ సూచన",
  "తేలియాడే AI బటన్ మరియు చాట్‌బాట్", "క్లయింట్ ర్యాపర్", "ఫుటర్", "పైకి వెళ్లే బటన్",
];

export default function TestLabPage() {
  return (
    <Box component="main" id="main-content" sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight={800}>Playwright పరీక్షల కేంద్రం</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            ఈ కేంద్రం అప్లికేషన్‌లోని అన్ని పేజీలకు ఉన్న Playwright బ్రౌజర్ పరీక్షా సందర్భాల జాబితా మరియు వాటిని నడిపే విధానాన్ని చూపుతుంది.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Playwright పరీక్షలను ఎలా ఉపయోగించాలి</Typography>
          <Stack component="ol" spacing={1} sx={{ my: 0, pl: 3 }}>
            <Typography component="li">టెర్మినల్‌లో ప్రాజెక్ట్ ఫోల్డర్‌ను తెరవండి.</Typography>
            <Typography component="li">ప్యాకేజీలను ఇన్‌స్టాల్ చేయండి: <code>npm install</code></Typography>
            <Typography component="li">Chromium బ్రౌజర్‌ను ఇన్‌స్టాల్ చేయండి: <code>npx playwright install chromium</code></Typography>
            <Typography component="li">అన్ని పరీక్షలను నడపండి: <code>npm run test:e2e</code></Typography>
            <Typography component="li">పరీక్షా నివేదికను బ్రౌజర్‌లో చూడండి: <code>npx playwright show-report</code></Typography>
            <Typography component="li">పరీక్ష విఫలమైతే ట్రేస్ ఫైల్‌ను తెరిచి కారణాన్ని పరిశీలించండి.</Typography>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>పేజీ పరీక్షా సందర్భాలు</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>ప్రతి సందర్భం పేజీ విజయవంతంగా స్పందిస్తుందా మరియు బ్రౌజర్‌లో రెండర్ అవుతుందా అని ధృవీకరిస్తుంది.</Typography>
          <Stack spacing={1}>
            {pageCases.map(([name, path]) => (
              <Stack key={path} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box><Typography fontWeight={600}>{name}</Typography><Typography variant="body2" color="text.secondary">{path}</Typography></Box>
                <Chip size="small" label="Playwright పరీక్ష" color="primary" variant="outlined" />
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>సాధారణ భాగాల పరీక్షా పరిధి</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>ఈ భాగాలు గ్లోబల్ లేఅవుట్ లేదా పై పేజీ పరీక్షల ద్వారా Playwright లో పరీక్షించబడతాయి.</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>{sharedComponents.map((name) => <Chip key={name} label={name} color="primary" variant="outlined" />)}</Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
