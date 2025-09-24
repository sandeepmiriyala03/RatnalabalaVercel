'use client';

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material";
import html2canvas from "html2canvas";

// Question type
type Question = {
  question: string;
  options: string[];
  answer: number;
};

const allQuestions: Question[] = [
  { question: "మిరియాల రామకృష్ణ గారి పుట్టిన ఊరు?", options: ["విజయవాడ", "తోలేరు", "హైదరాబాద్", "తణుకు"], answer: 1 },
  { question: "మిరియాల రామకృష్ణ గారి ప్రధాన సాహిత్య పరిశోధన ఎవరి మీద?", options: ["శ్రీశ్రీ", "విశ్వనాథ సత్యనారాయణ", "చాగంటి", "సినారె"], answer: 0 },
  { question: "వారు ఎన్ని సంవత్సరాలు విద్యాశాఖలో పనిచేశారు?", options: ["20", "15", "36", "5"], answer: 2 },
  { question: "వారు మొదటి పుస్తకం పేరు?", options: ["ముత్యాలగొడుగు", "బాలాభిరామం", "విద్యుద్వీణలు", "స్నేహదేహళి"], answer: 1 },
  { question: "వారు డాక్టరేట్ పొందిన అంశం?", options: ["తెలుగు వ్యాకరణం", "ప్రాచీన కవిత్వం", "శ్రీశ్రీ సాహిత్యం", "చరిత్ర"], answer: 2 },
  { question: "మహారాజా సంస్కృత పాఠశాల ఎక్కడ ఉంది?", options: ["హైదరాబాద్", "విజయనగరం", "తణుకు", "రాజమండ్రి"], answer: 1 },
  { question: "వారు ప్రముఖంగా అనుసంధానమైన పత్రిక?", options: ["ఆంధ్రభూమి", "ఆంధ్రజ్యోతి", "తరంగిణి", "ఈనాడు"], answer: 2 },
  { question: "మిరియాల రామకృష్ణ గారి రచనలు ఏ అంశాలపై ఎక్కువగా ఉంటాయి?", options: ["విజ్ఞానం", "సాంస్కృతిక సమస్యలు", "పర్యటనలు", "క్రీడలు"], answer: 1 },
  { question: "ప్రస్తుత సామాజిక అంశం ఆయన రచనల్లో ఏది?", options: ["అక్షరాస్యత", "పర్యావరణం", "సమానత్వం", "అన్ని"], answer: 3 },
  { question: "తెలుగు భాషలో ఆయన ప్రధాన పురస్కారం ఏది?", options: ["జాతీయ అవార్డు", "ఇండిపెండెన్స్ అవార్డు", "కవి పరమాణు", "అభినందన"], answer: 0 },
  { question: "మిరియాల రామకృష్ణ గారి ప్రతిష్ఠాత్మక పత్రిక?", options: ["సాహిత్యం", "సంపాదక సంఘం", "తరంగిణి", "వేదాంత"], answer: 2 },
  { question: "వారి కవిత్వంలో ప్రధానంగా పెరిగిన అంశం?", options: ["సామాజిక బాధ్యత", "ప్రేమ", "ప్రకృతి", "అంతరంగం"], answer: 0 },
  { question: "వారి మొదటి పాఠశాల పేరు?", options: ["రాజారావ్ పాఠశాల", "మహారాజా పాఠశాల", "మిత్ర పాఠశాల", "ఆచార్య పాఠశాల"], answer: 0 },
  { question: "ఏదైనా రచనలో వీరు ఉపయోగించిన ముఖ్యం పద్ధతి?", options: ["నూతన భావన", "పారంపర్య శైలి", "ప్రయోగాత్మక పద్దతి", "కథానాయకుడు"], answer: 2 },
  { question: "వారి పుస్తకాలలో ఏదీ బాలసాహిత్యం కాదు?", options: ["బాలాభిరామం", "సాహిత్య పదకోశం", "స్నేహదేహళి", "వివేకపట్టణం"], answer: 1 },
  { question: "మిరియాల రామకృష్ణ గారు ఎక్కువగా ఏ భాషలో రచనలు చేశారు?", options: ["తెలుగు", "హిందీ", "సంస్కృతం", "ఇంగ్లీష్"], answer: 0 },
  { question: "వారు ప్రసిద్ధి చెందిన పాఠశాల ఏది?", options: ["కూనవరం పాఠశాల", "హైదరాబాద్ పాఠశాల", "అనంతపుర పాఠశాల", "తణుకు పాఠశాల"], answer: 2 },
  { question: "మిరియాల రామకృష్ణ గారి గురించి కొత్తగా నేర్చుకున్నది ఏమిటి?", options: ["ఆయన సాహిత్యం", "ఆయన జీవితం", "ఆయన పురస్కారాలు", "పైనివన్నారు"], answer: 3 },
  { question: "మిరియాల గారి రచనలు ఏ దేశీయ పత్రికలో ప్రచురించబడ్డాయ్?", options: ["ఆంధ్రజ్యోతి", "తెలుగు జగత్", "ఈనాడు", "మంత్రిమండలి"], answer: 0 },
];

// Scorecard component with image download functionality
type ScorecardProps = {
  score: number;
  total: number;
  onShare: () => void;
};

function Scorecard({ score, total, onShare }: ScorecardProps) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (ref.current) {
      const canvas = await html2canvas(ref.current);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `ratnalabala-quiz-score.png`;
      link.click();
    }
  };

  return (
    <>
      <Box
        ref={ref}
        sx={{
          maxWidth: 360,
          margin: "0 auto",
          padding: 3,
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          backgroundColor: theme.palette.background.paper,
          textAlign: "center",
          fontFamily: "'Noto Sans Telugu', sans-serif",
          color: theme.palette.text.primary,
          userSelect: "none",
        }}
        id="scorecard-root"
      >

         <Box
    component="img"
    src="/Images/MiriaPen.jpg" 
    alt="డాక్టర్ మిరియాల రామకృష్ణ"
    sx={{
      width: 120,
      height: 120,
      borderRadius: "50%",
      objectFit: "cover",
      margin: "0 auto 16px",
      display: "block",
      boxShadow: theme.shadows[3],
    }}
  />
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", mb: 2, color: theme.palette.primary.main }}
        >
         మీ క్విజ్ ఫలితం
        </Typography>

        <Typography variant="body1" sx={{ mb: 1 }}>
          📅 తేదీ:{" "}
          {new Date().toLocaleDateString("te-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>

        <Box sx={{ fontSize: 40, mb: 1 }}>
          {Array.from({ length: score }).map((_, i) => (
            <span key={i} style={{ color: "#ffb400" }}>
              ⭐
            </span>
          ))}
          {Array.from({ length: total - score }).map((_, i) => (
            <span key={i} style={{ color: "#ccc" }}>
              ⭐
            </span>
          ))}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
          {score} / {total}
        </Typography>

     <Typography
  variant="body2"
  sx={{
    mb: 3,
    whiteSpace: "pre-line",
    lineHeight: 1.6,
    fontWeight: "medium",
    letterSpacing: 0.3,
    color: "text.primary",
  }}
> 
  🚀 అభినందనలు! మీ విజయం మిన్నగా మెరిసిపోతోంది!

      రత్నాలబాల పద్యాలవాల భావాలమాల

  {"\n\n"}📚 మరిన్ని క్విజ్‌లతో కలిసి చదవండి, 👉{" "}
  <Box
    component="span"
    sx={{ color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
    onClick={() => window.open("https://ratnalabala.vercel.app/", "_blank")}
  >
    https://ratnalabala.vercel.app/
  </Box>

  {"\n\n"}❤️ మీ స్నేహితులతో ఈ విజయాన్ని పంచుకోండి!

</Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleDownloadImage}
        sx={{ marginTop: 2, fontWeight: "bold" }}
      >
        స్కోరు ఇమేజ్‌గా డౌన్లోడ్ చేసుకోండి
      </Button>

      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ marginTop: 2, fontWeight: "bold" }}
        onClick={onShare}
      >
        వాట్సాప్‌లో షేర్ చేయండి
      </Button>
    </>
  );
}

export default function MiraQuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const selected = getRandomQuestions(allQuestions, 5);
    setQuestions(selected);
    setAnswers(Array(5).fill(null));
  }, []);

  const handleChange = (qIdx: number, optionIdx: number) => {
    const updatedAnswers = [...answers];
    updatedAnswers[qIdx] = optionIdx;
    setAnswers(updatedAnswers);
  };

  const handleSubmit = () => {
    if (answers.includes(null)) {
      setSnackbarOpen(true);
      return;
    }
    let correct = 0;
    answers.forEach((ans, idx) => {
      if (ans === questions[idx].answer) correct++;
    });
    setScore(correct);
    setShowResult(true);
  };

  const handleReset = () => {
    const selected = getRandomQuestions(allQuestions, 5);
    setQuestions(selected);
    setAnswers(Array(5).fill(null));
    setShowResult(false);
    setScore(0);
  };

  const shareText = `

         🎉 *మిరియాల రామకృష్ణ గారి మీద  మీ క్విజ్ ఫలితం* 🎉


🗓️ *తేదీ:* ${new Date().toLocaleDateString("te-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}

🏆      *మీ స్కోరు:*
─────────────────────
${"⭐".repeat(score)}${"☆".repeat(5 - score)}  (${score} / 5)
─────────────────────

🚀 అభినందనలు! మీ విజయం మిన్నగా మెరిసిపోతోంది!

📚 మరిన్ని క్విజ్‌లతో కలిసి చదవండి,👉 https://ratnalabala.vercel.app/

❤️ మీ స్నేహితులతో ఈ విజయాన్ని పంచుకోండి!
`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {!showResult ? (
        <Card>
          <CardContent>
            <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
              మిరా గారి మీద క్విజ్
            </Typography>

            {questions.map((q, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {`Q${idx + 1}. ${q.question}`}
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={answers[idx]}
                    onChange={(_, val) => handleChange(idx, Number(val))}
                  >
                    {q.options.map((opt, i) => (
                      <FormControlLabel
                        key={i}
                        value={i}
                        control={<Radio />}
                        label={opt}
                        disabled={showResult}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={answers.includes(null)}
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              సమర్పించండి
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Scorecard score={score} total={5} onShare={handleShareWhatsApp} />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" sx={{ width: "100%" }}>
          దయచేసి అన్ని ప్రశ్నలకు సమాధానాలు ఎంచుకోండి.
        </Alert>
      </Snackbar>

      {showResult && (
        <Box textAlign="center" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={handleReset}>
            మళ్లీ ప్రయత్నించండి
          </Button>
        </Box>
      )}
    </Container>
  );
}

function getRandomQuestions(allQ: Question[], n: number): Question[] {
  const shuffled = [...allQ].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}
