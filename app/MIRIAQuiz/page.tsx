"use client";

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

/* ================= TYPES ================= */

type Question = {
  question: string;
  options: string[];
  answer: number;
};

type ScorecardProps = {
  score: number;
  total: number;
  onShare: () => void;
};

/* ================= QUESTIONS ================= */

const allQuestions: Question[] = [
  { question: "మిరియాల రామకృష్ణ గారి పుట్టిన ఊరు?", options: ["విజయవాడ", "తోలేరు", "హైదరాబాద్", "తణుకు"], answer: 1 },
  { question: "మిరియాల రామకృష్ణ గారి ప్రధాన సాహిత్య పరిశోధన ఎవరి మీద?", options: ["శ్రీశ్రీ", "విశ్వనాథ సత్యనారాయణ", "చాగంటి", "సినారె"], answer: 0 },
  { question: "వారు ఎన్ని సంవత్సరాలు విద్యాశాఖలో పనిచేశారు?", options: ["20", "15", "36", "5"], answer: 2 },
  { question: "వారు మొదటి పుస్తకం పేరు?", options: ["ముత్యాలగొడుగు", "బాలాభిరామం", "విద్యుద్వీణలు", "స్నేహదేహళి"], answer: 1 },
  { question: "వారు డాక్టరేట్ పొందిన అంశం?", options: ["తెలుగు వ్యాకరణం", "ప్రాచీన కవిత్వం", "శ్రీశ్రీ సాహిత్యం", "చరిత్ర"], answer: 2 },
];

/* ================= SCORECARD ================= */

function Scorecard({ score, total, onShare }: ScorecardProps) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "ratnalabala-quiz-score.png";
    link.click();
  };

  return (
    <>
      <Box
        ref={ref}
        sx={{
          maxWidth: 360,
          mx: "auto",
          p: 3,
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          backgroundColor: theme.palette.background.paper,
          textAlign: "center",

          /* ✅ GLOBAL FONT APPLY */
          fontFamily: "var(--telugu-font-family)",
          fontSize: "var(--telugu-font-size)",
          lineHeight: 1.8,
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
          మీ క్విజ్ ఫలితం
        </Typography>

        <Typography sx={{ mb: 1 }}>
          📅 తేదీ:{" "}
          {new Date().toLocaleDateString("te-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>

        <Box sx={{ fontSize: 36, mb: 1 }}>
          {"⭐".repeat(score)}
          {"☆".repeat(total - score)}
        </Box>

        <Typography sx={{ fontWeight: 700, mb: 2 }}>
          {score} / {total}
        </Typography>

        <Typography sx={{ whiteSpace: "pre-line" }}>
          🚀 అభినందనలు!  
          మీ విజయం మిన్నగా మెరిసిపోతోంది!

          {"\n\n"}రత్నాలబాల · పద్యాలవాల · భావాలమాల

          {"\n\n"}👉 https://ratnalabala.vercel.app/
        </Typography>
      </Box>

      <Button fullWidth sx={{ mt: 2 }} variant="contained" onClick={handleDownloadImage}>
        స్కోరు ఇమేజ్‌గా డౌన్లోడ్
      </Button>

      <Button fullWidth sx={{ mt: 2 }} color="success" variant="contained" onClick={onShare}>
        వాట్సాప్‌లో షేర్
      </Button>
    </>
  );
}

/* ================= MAIN PAGE ================= */

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
    const updated = [...answers];
    updated[qIdx] = optionIdx;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    if (answers.includes(null)) {
      setSnackbarOpen(true);
      return;
    }
    let correct = 0;
    answers.forEach((a, i) => {
      if (a === questions[i].answer) correct++;
    });
    setScore(correct);
    setShowResult(true);
  };

  const handleReset = () => {
    const selected = getRandomQuestions(allQuestions, 5);
    setQuestions(selected);
    setAnswers(Array(5).fill(null));
    setScore(0);
    setShowResult(false);
  };

  const shareText = `
🎉 మీ క్విజ్ ఫలితం 🎉

⭐ ${score} / 5

👉 https://ratnalabala.vercel.app/
`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        py: 4,

        /* ✅ GLOBAL FONT SAFETY */
        fontFamily: "var(--telugu-font-family)",
        fontSize: "var(--telugu-font-size)",
      }}
    >
      {!showResult ? (
        <Card>
          <CardContent>
            <Typography
              align="center"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: "calc(var(--telugu-font-size) * 1.6)",
              }}
            >
              మిరా గారి మీద క్విజ్
            </Typography>

            {questions.map((q, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Q{idx + 1}. {q.question}
                </Typography>

                <FormControl>
                  <RadioGroup
                    value={answers[idx]}
                    onChange={(_, val) => handleChange(idx, Number(val))}
                  >
                    {q.options.map((opt, i) => (
                      <FormControlLabel
                        key={i}
                        value={i}
                        control={<Radio />}
                        label={
                          <Typography
                            sx={{
                              fontFamily: "var(--telugu-font-family)",
                              fontSize: "var(--telugu-font-size)",
                            }}
                          >
                            {opt}
                          </Typography>
                        }
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}

            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={answers.includes(null)}
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
      >
        <Alert severity="warning">దయచేసి అన్ని ప్రశ్నలకు సమాధానాలు ఎంచుకోండి.</Alert>
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

/* ================= HELPERS ================= */

function getRandomQuestions(allQ: Question[], n: number): Question[] {
  return [...allQ].sort(() => 0.5 - Math.random()).slice(0, n);
}
