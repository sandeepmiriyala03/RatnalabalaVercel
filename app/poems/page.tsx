"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  Stack
} from "@mui/material";

import ShuffleIcon from "@mui/icons-material/Shuffle";
import ClearIcon from "@mui/icons-material/Clear";

import PoemCard from "@/app/components/PoemCard";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const ITEMS_PER_PAGE = 3;

const POETRY_NAME = "రత్నాలబాల — పద్యాలవాల — భావాలమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";

export default function PoemList() {

  const [poems,setPoems] = useState<Poem[]>([]);
  const [voices,setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready,setReady] = useState(false);

  const [search,setSearch] = useState("");

  const [aiQuery,setAiQuery] = useState("");
  const [aiResult,setAiResult] = useState("");

  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);

  const [page,setPage] = useState(1);
  const [viewAll,setViewAll] = useState(false);

  /* LOAD POEMS */

  useEffect(()=>{

    const load = async()=>{

      try{

        const res = await fetch("/api/poems");

        if(!res.ok) throw new Error();

        const data:Record<string,string> = await res.json();

        const arr:Poem[] = Object.entries(data).map(
          ([title,content])=>({
            title,
            content,
            slug:title
          })
        );

        setPoems(arr);

      }catch{

        setError("పద్యాలను లోడ్ చేయడంలో లోపం సంభవించింది.");

      }finally{

        setLoading(false);

      }

    };

    load();

  },[]);

  /* SPEECH */

  useEffect(()=>{

    if("speechSynthesis" in window){

      const loadVoices=()=>{

        const v = window.speechSynthesis.getVoices();

        if(v.length){
          setVoices(v);
          setReady(true);
        }

      };

      loadVoices();

      window.speechSynthesis.onvoiceschanged = loadVoices;

    }

    return ()=>window.speechSynthesis.cancel();

  },[]);

  const stopSpeech = ()=>window.speechSynthesis.cancel();

  const speak = (text:string)=>{

    stopSpeech();

    const u = new SpeechSynthesisUtterance(text);

    u.lang="te-IN";
    u.rate=0.8;

    const voice = voices.find(v=>v.lang==="te-IN");

    if(voice) u.voice = voice;

    window.speechSynthesis.speak(u);

  };

  /* FILTER */

  const filtered = useMemo(()=>{

    return poems.filter(p=>
      p.title.includes(search) ||
      p.content.includes(search)
    )

  },[poems,search]);

  const itemsPerPage = viewAll ? filtered.length : ITEMS_PER_PAGE;

  const totalPages = Math.ceil(filtered.length/itemsPerPage);

  const current = filtered.slice(
    (page-1)*itemsPerPage,
    page*itemsPerPage
  );

  useEffect(()=>{

    setPage(1);
    stopSpeech();

  },[search,viewAll]);

  /* RANDOM */

  const randomPoem = ()=>{

    const r = poems[Math.floor(Math.random()*poems.length)];

    if(r) setSearch(r.title);

  };

  /* AI SEARCH */

  const aiSearch = async()=>{

    if(!aiQuery) return;

    try{

      const res = await fetch("/api/semantic-search",{
        method:"POST",
        body:JSON.stringify({question:aiQuery})
      });

      const data = await res.json();

      setAiResult(`${data.title}\n\n${data.poem}`);

    }catch{

      setAiResult("AI సమాధానం పొందడంలో లోపం జరిగింది.");

    }

  };

  return(

    <Box
    sx={{
      p:{xs:2,sm:4},
      maxWidth:900,
      mx:"auto"
    }}
    >

      <Typography
      variant="h3"
      fontWeight={800}
      align="center"
      sx={{
        mb:2,
        background:"linear-gradient(90deg,#0f172a,#2563eb)",
        WebkitBackgroundClip:"text",
        WebkitTextFillColor:"transparent"
      }}
      >
      రత్నాలబాల
      </Typography>

      <Typography align="center" mb={3}>
      మొత్తం పద్యాలు: <strong>{poems.length}</strong>
      </Typography>

      {/* MCP PANEL */}

      <Box
      sx={{
        p:2,
        mb:3,
        borderRadius:2,
        background:"#f8fafc",
        border:"1px solid #e2e8f0"
      }}
      >

      <Typography fontWeight={700}>
      🤖 AI సహాయంతో పద్య అన్వేషణ
      </Typography>

      <Typography sx={{fontSize:"0.9em",mt:1}}>
      • పద్యం భావం తెలుసుకోండి  
      • అంశం గుర్తించండి  
      • సంబంధిత పద్యాలు  
      • యాదృచ్ఛిక పద్యం  
      • గురువు వివరణ  
      • AI ప్రశ్న అడిగి పద్యం పొందండి
      </Typography>

      </Box>

      {/* SEARCH */}

      <Stack spacing={2} mb={3}>

      <TextField
      label="పద్యం కోసం వెతకండి..."
      fullWidth
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      />

      <Stack direction="row" spacing={1} justifyContent="center">

      <Button
      startIcon={<ShuffleIcon/>}
      variant="contained"
      onClick={randomPoem}
      >
      యాదృచ్ఛిక పద్యం
      </Button>

      {search &&(

      <Button
      startIcon={<ClearIcon/>}
      variant="outlined"
      onClick={()=>setSearch("")}
      >
      క్లియర్
      </Button>

      )}

      <Button
      variant={viewAll ? "outlined":"contained"}
      onClick={()=>setViewAll(v=>!v)}
      >
      {viewAll ? "పేజీలు":"అన్ని"}
      </Button>

      </Stack>

      </Stack>

      {/* AI SEARCH */}

      <Box
      sx={{
        p:2,
        mb:3,
        borderRadius:2,
        background:"#f1f5f9"
      }}
      >

      <Typography fontWeight={600} mb={1}>
      🧠 AI పద్యం వెతకండి
      </Typography>

      <Stack direction={{xs:"column",sm:"row"}} spacing={1}>

      <TextField
      fullWidth
      placeholder="ఉదా: మంచి మనిషి ఎలా అవ్వాలి"
      value={aiQuery}
      onChange={(e)=>setAiQuery(e.target.value)}
      />

      <Button
      variant="contained"
      onClick={aiSearch}
      >
      AI వెతుకు
      </Button>

      </Stack>

      </Box>

      {aiResult &&(

      <Box
      sx={{
        p:2,
        mb:3,
        borderRadius:2,
        background:"#f8fafc",
        whiteSpace:"pre-line"
      }}
      >

      <Typography fontWeight={700} mb={1}>
      🤖 AI ఫలితం
      </Typography>

      {aiResult}

      </Box>

      )}

      {/* LOADING */}

      {loading &&(
      <Typography align="center">
      పద్యాలు లోడ్ అవుతున్నాయి…
      </Typography>
      )}

      {error &&(
      <Typography align="center" color="error">
      {error}
      </Typography>
      )}

      {/* POEMS */}

      {!loading && !error && current.map(poem=>(

      <PoemCard
      key={poem.slug}
      poem={poem}
      ready={ready}
      speak={speak}
      stopSpeech={stopSpeech}
      authors={AUTHORS}
      poetryName={POETRY_NAME}
      />

      ))}

      {/* PAGINATION */}

      {!viewAll && filtered.length>ITEMS_PER_PAGE &&(

      <Box display="flex" justifyContent="center" mt={4}>

      <Pagination
      count={totalPages}
      page={page}
      onChange={(_,val)=>{

        setPage(val);

        window.scrollTo({
          top:0,
          behavior:"smooth"
        });

      }}
      />

      </Box>

      )}

    </Box>

  );

}