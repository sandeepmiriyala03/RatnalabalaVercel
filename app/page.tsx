"use client";

import {
  Box,
  Typography,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from "@mui/material";
import { useState } from "react";


// --- Language-specific Content Constants ---
const teluguRnDIntro = `
 ఇది మా తాతగారి 1983 నాటి 35 తెలుగు పద్యాల నుండి ప్రేరణ పొందిన డిజిటల్ ప్రాజెక్ట్. ఈ ప్రాజెక్ట్‌ను కృత్రిమ మేధస్సు ఉపయోగించి మలిచాం.

నా AI ప్రయాణం: డిజిటలైజేషన్ ప్రాజెక్ట్
చేతితో రాసిన తెలుగు పద్యాలను డిజిటల్ రూపంలోకి మార్చడానికి నేను వివిధ AI టూల్స్ మరియు ఆధునిక వెబ్ టెక్నాలజీలను ఉపయోగించాను.

**సహజ భాషా ప్రాసెసింగ్ (NLP) ద్వారా**: నా చేతిరాతను డిజిటల్ టెక్స్‌ట్‌గా మార్చడానికి OCR (ఆప్టికల్ క్యారెక్టర్ రికగ్నిషన్) టూల్స్ ఉపయోగించాను. ఇది ఒక రకమైన NLP, ఇది కంప్యూటర్‌లు మానవ భాషను అర్థం చేసుకోవడానికి మరియు ప్రాసెస్ చేయడానికి సహాయపడుతుంది.

**ప్రాంప్ట్ ఇంజనీరింగ్ తో సంగీతం సృష్టించడం**: "రత్నాల బాల పద్యాలవాల భావాల మాల" అనే కీవర్డ్స్ (ఇవి ప్రాంప్ట్‌లుగా పనిచేస్తాయి) ఇచ్చి, Suno AI తో నా పద్యాలకు సంగీతాన్ని సృష్టించాను. **ప్రాంప్ట్ ఇంజనీరింగ్** అనేది AI మోడల్స్ నుండి కావలసిన అవుట్‌పుట్‌లను పొందడానికి ప్రభావవంతమైన సూచనలను రూపొందించే కళ మరియు విజ్ఞానం.

**ఆలోచనలు, కోడింగ్‌లో సహాయం (LLMs)**: ChatGPT మరియు Gemini AI వంటి పెద్ద భాషా నమూనాలు (Large Language Models - LLMs) నాకు ఆలోచనలు ఇవ్వడానికి మరియు కోడింగ్ సహాయం చేయడానికి చాలా ఉపయోగపడ్డాయి. LLMs అనేవి NLPలో ఒక పురోగతి, ఇవి సంక్లిష్టమైన మానవ భాషా పనులను చేయగలవు.

సరైన AI ఎంచుకోవడం: నా "డిజిటలైజేషన్" అవసరాలకు సరిపోయే ఉత్తమ AI టూల్స్‌ను ఎంచుకోవడానికి నేను LoveableDev వంటి వాటిని కూడా పరిశీలించాను.

నేను ఉపయోగించిన టెక్నాలజీలు:
Next.js & TypeScript: ఇవి ఆధునిక, వేగవంతమైన వెబ్‌సైట్‌లను నిర్మించడానికి ఉపయోగపడే టూల్స్. TypeScript నా కోడ్‌ను శుభ్రంగా మరియు తక్కువ లోపాలతో ఉంచడానికి సహాయపడుతుంది.

డేటాబేస్ లేకుండా ఫైల్స్: సంక్లిష్టమైన డేటాబేస్ బదులుగా, నేను నా పద్యాలను సాధారణ మార్క్‌డౌన్ ఫైల్స్లో నిల్వ చేశాను. ఇది భవిష్యత్తులో 35 నుండి 1000+ పద్యాలను కూడా సులభంగా జోడించడానికి సహాయపడుతుంది.

Vercel: నా వెబ్‌సైట్‌ను ఉచితంగా హోస్ట్ చేయడానికి మరియు అందరికీ అందుబాటులో ఉంచడానికి నేను Vercel ను ఉపయోగించాను.

వెబ్‌సైట్ టెస్టింగ్: నా వెబ్‌సైట్ ఎక్కువ మంది సందర్శకులను తట్టుకోగలదా అని తనిఖీ చేయడానికి నేను loader.io ను కూడా ఉపయోగించాను.
`;

const englishRnDIntro = `Welcome to Ratnalabala. A digital project inspired by my grandfather's 1983 Telugu poems, converted into music and video using artificial intelligence.

My AI-Powered Project: Digitalizing Telugu Poems
I used different AI tools and web technologies to turn my handwritten Telugu poems into a digital collection.

**How Natural Language Processing (NLP) Helped Me**: I used OCR (Optical Character Recognition) tools to scan photos of my handwritten Telugu poems and turn them into digital text. OCR is a form of **NLP**, which helps computers understand and process human language.

**Creating Music with Prompt Engineering**: With Suno AI, I gave it some Telugu keywords (which served as **prompts**) like "రత్నాల బాల పద్యాలవాల భావాల మాల," and it generated music for my poems. **Prompt engineering** is the art and science of crafting effective instructions to get desired outputs from AI models.

**Getting Ideas & Help with Code (via LLMs)**: Large Language Models (LLMs) like ChatGPT and Gemini AI were super helpful for brainstorming and even getting coding assistance. LLMs are an advancement in NLP, enabling them to perform complex human language tasks.

Finding the best AI fit: I explored different AI tools, including LoveableDev, to pick the best ones for my project.

The Technologies I Used:
Next.js & TypeScript: These are modern web tools that helped me build a fast and reliable website. TypeScript makes sure my code is clean and has fewer errors.

No database, just files: Instead of a complex database, I stored my poems in simple Markdown files. This makes it easy to add more poems from just 36 to over 1000+ in the future!

Vercel: I used Vercel to host my website for free, making it live for everyone to see.

Testing my website: I even used loader.io to check if my website could handle many visitors at once.
`;

const teluguRnDHeading = "పరిశోధన స్రవంతి";
const englishRnDHeading = "Discovery Streams";

// --- HomePage Component ---
export default function HomePage() {
  const [lang, setLang] = useState<"te" | "en">("te");

  // All speech-related state and effects have been removed as they are no longer needed.

  return (
    <Container sx={{ mt: 6 }}>
       {/* PWA install banner – only Android */}
   
      {/* --- Language Toggle --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_, newLang) => {
            if (newLang) {
              setLang(newLang);
            }
          }}
          aria-label="language selection"
        >
          <ToggleButton value="te" aria-label="Telugu">తెలుగు</ToggleButton>
          <ToggleButton value="en" aria-label="English">English</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* --- Research and Development Section --- */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {lang === "te" ? teluguRnDHeading : englishRnDHeading}
        </Typography>

        <CardContent>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-line",
              textAlign: "left",
              maxWidth: '800px',
              mx: 'auto',
              color: 'text.primary',
            }}
          >
            {lang === "te" ? teluguRnDIntro : englishRnDIntro}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}