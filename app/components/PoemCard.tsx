"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  IconButton,
  Button,
  TextField
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";

import ShareButtons from "@/app/components/ShareBar";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Score = {
  label: string;
  value: number;
};

type Props = {
  poem: Poem;
  ready: boolean;
  speak: (text: string) => void;
  stopSpeech: () => void;
  authors?: string | string[];
  poetryName?: string;
};

export default function PoemCard({
  poem,
  ready,
  speak,
  stopSpeech,
  authors,
  poetryName,
}: Props) {

  const poemRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState("");
  const [scores, setScores] = useState<Score[]>([]);
  const [question, setQuestion] = useState("");

  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  /* MCP API CALL */

  const callAPI = async (url: string, method = "POST") => {

    try {

      const res = await fetch(url,{
        method,
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({ poem: poem.content })
      });

      const data = await res.json();

      const message =
        data.explanation ||
        data.theme ||
        data.result ||
        data.message ||
        `${data.title ?? ""}\n\n${data.poem ?? ""}`;

      setResult(message);

      if(data.scores){
        setScores(data.scores);
      } else {
        setScores([]);
      }

    } catch {

      setResult("లోపం సంభవించింది.");
      setScores([]);

    }

  };

  /* AI QUESTION */

  const askAI = async () => {

    if (!question) return;

    try {

      const res = await fetch("/api/ask",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({ question })
      });

      const data = await res.json();

      setResult(`${data.title}\n\n${data.poem}`);
      setScores([]);

    } catch {

      setResult("సమాధానం పొందడంలో లోపం జరిగింది.");

    }

  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ lineHeight: 1.9 }}>

        {/* POEM */}

        <Box
          ref={poemRef}
          sx={{
            px: { xs: 2, sm: 4 },
            py: { xs: 3, sm: 4 },
          }}
        >

          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1.3em",
              mb: 2,
            }}
          >
            {poem.title}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography
            sx={{
              whiteSpace: "pre-line",
              textAlign: "center",
            }}
          >
            {poem.content}
          </Typography>

          {authorText && (
            <Typography
              sx={{
                mt: 2,
                textAlign: "right",
                fontSize: "0.9em",
              }}
            >
              — {authorText}
            </Typography>
          )}

          {poetryName && (
            <Typography
              sx={{
                mt: 3,
                textAlign: "center",
                fontSize: "0.8em",
                fontWeight: 600
              }}
            >
              {poetryName}
            </Typography>
          )}

        </Box>

        {/* AUDIO */}

        <Box sx={{ display: "flex", gap: 1 }}>

          <IconButton
            onClick={() => speak(`${poem.title}. ${poem.content}`)}
            disabled={!ready}
          >
            <VolumeUpIcon color="primary" />
          </IconButton>

          <IconButton
            onClick={stopSpeech}
            disabled={!ready}
          >
            <StopCircleIcon color="error" />
          </IconButton>

        </Box>

        {/* AI ACTION BUTTONS */}

        <Box
          sx={{
            mt: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 1
          }}
        >

          <Button
            size="small"
            variant="outlined"
            onClick={() => callAPI("/api/explain")}
          >
            🧠 భావం
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => callAPI("/api/theme")}
          >
            🎯 అంశం
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => callAPI("/api/random-poem","GET")}
          >
            🎲 మరో పద్యం
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => callAPI("/api/similar")}
          >
            🔗 సంబంధిత
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => callAPI("/api/guru")}
          >
            👨‍🏫 గురువు
          </Button>

        </Box>

        {/* AI QUESTION */}

        <Box sx={{ mt: 3 }}>

          <Typography sx={{ fontSize: "0.9em", mb: 1 }}>
            ప్రశ్న అడగండి
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>

            <TextField
              size="small"
              fullWidth
              placeholder="ఉదా: దానం గురించి పద్యం"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <Button
              variant="contained"
              onClick={askAI}
            >
              అడగండి
            </Button>

          </Box>

        </Box>

        {/* RESULT TEXT */}

        {result && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              background: "#f3f4f6",
              whiteSpace: "pre-line"
            }}
          >
            {result}
          </Box>
        )}

        {/* AI SIMILARITY GRAPH */}

        {scores.length > 0 && (

          <Box sx={{ mt: 2 }}>

            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              📊 AI Similarity Graph
            </Typography>

            {scores.map((s,i)=>{

              const percent = Math.round(s.value * 100);

              return(

                <Box key={i} sx={{ mb: 1 }}>

                  <Typography sx={{ fontSize:"0.85em" }}>
                    {s.label} ({percent}%)
                  </Typography>

                  <Box
                    sx={{
                      height:10,
                      background:"#e5e7eb",
                      borderRadius:2,
                      overflow:"hidden"
                    }}
                  >

                    <Box
                      sx={{
                        width:`${percent}%`,
                        height:"100%",
                        background:"#2563eb"
                      }}
                    />

                  </Box>

                </Box>

              )

            })}

          </Box>

        )}

        {/* SHARE */}

        <Box sx={{ mt: 2 }}>
          <ShareButtons targetRef={poemRef} />
        </Box>

        {/* AI HOW IT WORKS */}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            background: "#fff7ed",
            border: "1px solid #fed7aa"
          }}
        >

          <Typography fontWeight={700} mb={1}>
            🤖 ఈ AI ఎలా పని చేస్తుంది?
          </Typography>

          <Typography sx={{ fontSize: "0.9em", lineHeight: 1.9 }}>

            🧠 <b>భావం</b><br/>
            AI పద్యాన్ని చదివి దాని భావాన్ని అర్థం చేసుకుంటుంది.<br/><br/>

            🎯 <b>అంశం</b><br/>
            పద్యానికి సంబంధించిన ప్రధాన విషయాన్ని గుర్తిస్తుంది.<br/>
            ఉదా: ధర్మం, దానం, సద్గుణం.<br/><br/>

            🔗 <b>సంబంధిత పద్యాలు</b><br/>
            AI ప్రతి పద్యాన్ని సంఖ్యల రూపంలో (Vector) మార్చుతుంది.<br/>
            ఆ తరువాత అన్ని పద్యాలను పోల్చి దగ్గరగా ఉన్న పద్యాలను చూపిస్తుంది.<br/><br/>

            📊 <b>Similarity Score</b><br/>
            90% = చాలా దగ్గర<br/>
            70% = దగ్గర సంబంధం<br/>
            40% = కొంత సంబంధం<br/><br/>

            👨‍🏫 <b>గురువు వివరణ</b><br/>
            పద్యాన్ని గురువు లాగా చదివి దాని నీతి మరియు బోధను వివరిస్తుంది.

          </Typography>

        </Box>

      </CardContent>
    </Card>
  );
}