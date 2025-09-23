"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";

// Define Question type
type Question = {
  question: string;
  options: string[];
  answer: number;
};

// Full 25 questions array typed as Question[]
const allQuestions: Question[] = [
  { question: "మిరియాల రామకృష్ణ గారి పుట్టిన ఊరు?", options: ["విజయవాడ", "తోలేరు", "హైదరాబాద్", "తణుకు"], answer: 1 },
  { question: "మిరియాల రామకృష్ణ గారి ప్రధాన సాహిత్య పరిశోధన ఎవరి మీద?", options: ["శ్రీశ్రీ", "విశ్వనాథ సత్యనారాయణ", "చాగంటి", "సినారె"], answer: 0 },
  { question: "వారు ఎన్ని సంవత్సరాలు విద్యాశాఖలో పనిచేశారు?", options: ["20", "15", "36", "5"], answer: 2 },
  { question: "వారు మొదటి పుస్తకం పేరు?", options: ["ముత్యాలగొడుగు", "బాలాభిరామం", "విద్యుద్వీణలు", "స్నేహదేహళి"], answer: 1 },
  { question: "వారు డాక్టరేట్ పొందిన అంశం?", options: ["తెలుగు వ్యాకరణం", "ప్రాచీన కవిత్వం", "శ్రీశ్రీ సాహిత్యం", "చరిత్ర"], answer: 2 },
  { question: "మహారాజా సంస్కృత పాఠశాల ఎక్కడ ఉంది?", options: ["హైదరాబాద్", "విజయనగరం", "తణుకు", "రాజమండ్రి"], answer: 1 },
  { question: "వారు ప్రముఖంగా అనుసంధానమైన పత్రిక?", options: ["ఆంధ్రభూమి", "ఆంధ్రజ్యోతి", "తరంగిణి", "ఈనాడు"], answer: 2 },
  { question: "మిరియాల రామకృష్ణ గారి రచనలు ఏ అంశాలపై ఎక్కువగా ఉంటాయి?", options: ["విజ్ఞానం", "సాంస్కృతిక సమస్యలు", "పర్యటనలు", "క్రీడలు"], answer: 1 },
 // { question: "మీరు వ్యక్తిగతంగా మిరియాల గారిని కలవాలనుకుంటే అడగబోయే ప్రశ్న?", options: ["ప్రియమైన పుస్తకం", "ఆది బంధువులు", "స్థిర నివాసం", "ప్రత్యేక శక్తులు"], answer: 0 },
  { question: "ప్రస్తుత సామాజిక అంశం ఆయన రచనల్లో ఏది?", options: ["అక్షరాస్యత", "పర్యావరణం", "సమానత్వం", "అన్ని"], answer: 3 },
  { question: "తెలుగు భాషలో ఆయన ప్రధాన పురస్కారం ఏది?", options: ["జాతీయ అవార్డు", "ఇండిపెండెన్స్ అవార్డు", "కవి పరమాణు", "అభినందన"], answer: 0 },
  { question: "మిరియాల రామకృష్ణ గారి ప్రతిష్ఠాత్మక పత్రిక?", options: ["సాహిత్యం", "సంపాదక సంఘం", "తరంగిణి", "వేదాంత"], answer: 2 },
  //{ question: "వారి జీవితంలో ముఖ్యమైన సంఘటన ఇక్కడ ఏమిటి?", options: ["హృద్రోగ సమస్యలు", "పాఠశాల ఉపాధ్యాయుడు", "వ్యవస్థాపకుడు", "పరిశోధకుడు"], answer: 0 },
  { question: "వారి కవిత్వంలో ప్రధానంగా పెరిగిన అంశం?", options: ["సామాజిక బాధ్యత", "ప్రేమ", "ప్రకృతి", "అంతరంగం"], answer: 0 },
  { question: "వారి మొదటి పాఠశాల పేరు?", options: ["రాజారావ్ పాఠశాల", "మహారాజా పాఠశాల", "మిత్ర పాఠశాల", "ఆచార్య పాఠశాల"], answer: 0 },
  { question: "ఏదైనా రచనలో వీరు ఉపయోగించిన ముఖ్యం పద్ధతి?", options: ["నూతన భావన", "పారంపర్య శైలి", "ప్రయోగాత్మక పద్దతి", "కథానాయకుడు"], answer: 2 },
  { question: "వారి పుస్తకాలలో ఏదీ బాలసాహిత్యం కాదు?", options: ["బాలాభిరామం", "సాహిత్య పదకోశం", "స్నేహదేహళి", "వివేకపట్టణం"], answer: 1 },
  //{ question: "వారి ఇద్దరు పిల్లల పేర్లు ఏవి?", options: ["రమణీయ, కమనీయ", "సుధారాణి, కమనీయ", "సుధారాణి, శ్రీధర్", "కమనా, సుధా"], answer: 2 },
  { question: "మిరియాల రామకృష్ణ గారు ఎక్కువగా ఏ భాషలో రచనలు చేశారు?", options: ["తెలుగు", "హిందీ", "సంస్కృతం", "ఇంగ్లీష్"], answer: 0 },
  { question: "వారు ప్రసిద్ధి చెందిన పాఠశాల ఏది?", options: ["కూనవరం పాఠశాల", "హైదరాబాద్ పాఠశాల", "అనంతపుర పాఠశాల", "తణుకు పాఠశాల"], answer: 2 },
  { question: "మిరియాల రామకృష్ణ గారి గురించి కొత్తగా నేర్చుకున్నది ఏమిటి?", options: ["ఆయన సాహిత్యం", "ఆయన జీవితం", "ఆయన పురస్కారాలు", "పైనివన్నారు"], answer: 3 },
  { question: "మిరియాల గారి రచనలు ఏ దేశీయ పత్రికలో ప్రచురించబడ్డాయ్?", options: ["ఆంధ్రజ్యోతి", "తెలుగు జగత్", "ఈనాడు", "మంత్రిమండలి"], answer: 0 },
];

// Utility: random select N unique questions from array without mutating original
function getRandomQuestions(allQ: Question[], n: number): Question[] {
  const shuffled = [...allQ].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
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

  const shareText = `*మిరియాల రామకృష్ణ గారి  క్విజ్*\nమీ స్కోరు: ${score}/5 (${((score / 5) * 100).toFixed(2)}%)\nమరిన్ని  క్విజ్ కోసం https://ratnalabala.vercel.app/ సందర్శించండి`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            మిరియాల రామకృష్ణ గారి క్విజ్
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
                    <FormControlLabel key={i} value={i} control={<Radio />} label={opt} disabled={showResult} />
                  ))}
                </RadioGroup>
              </FormControl>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}

          {!showResult ? (
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
          ) : (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                అభినందనలు! మీరు {score} / 5 మార్కులు సాధించారు!
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 3 }}>
                శాతం: {((score / 5) * 100).toFixed(2)}%
              </Typography>
              <Button variant="contained" color="success" sx={{ mb: 2 }} onClick={handleShareWhatsApp}>
                స్కోరు షేర్ చేయండి - వాట్సాప్
              </Button>
              <br />
              <Button variant="outlined" onClick={handleReset}>
                మళ్లీ ప్రయత్నించండి
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

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
    </Container>
  );
}
