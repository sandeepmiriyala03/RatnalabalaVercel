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

import ClearIcon from "@mui/icons-material/Clear";

import PoemCard from "@/app/components/PoemCard";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const ITEMS_PER_PAGE = 10;

const POETRY_NAME = "యంత్ర సహకారం: చంధం AI పరికరాలు";
const AUTHORS: string | string[] = " నిర్మాణం, పర్యవేక్షణ, సారధ్యం  మిరియాల దిలీపు ";

export default function PoemList() {

  const [poems,setPoems] = useState<Poem[]>([]);
  const [voices,setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready,setReady] = useState(false);

  const [search,setSearch] = useState("");

  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);

  const [page,setPage] = useState(1);
  const [viewAll,setViewAll] = useState(false);

  /* LOAD POEMS */

  useEffect(()=>{

    const load = async()=>{

      try{

        const res = await fetch("/api/Ugadi108");

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

    const voice = voices.find(
      v => v.lang === "te-IN" || v.lang === "te"
    );

    if(voice) u.voice = voice;

    window.speechSynthesis.speak(u);

  };

  /* FILTER */

  const filtered = useMemo(()=>{

    const q = search.toLowerCase();

    return poems.filter(p=>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
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
      పరాభవమాల 
      </Typography>
<Box
  sx={{
    mb: 4,
    p: 3,
    borderRadius: 3,
    background: "#f8fafc",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
  }}
>

  <Typography variant="h5" fontWeight={700} mb={1}>
    ఉగాది శతకం: పరాభవ నామ సంవత్సర స్వాగతం
  </Typography>

  <Typography variant="body2" color="text.secondary" mb={2}>
    సృజన: Claude Opus 4.6
  </Typography>

  <Typography variant="body2" mb={1}>
    <strong>మానవ సహకారం:</strong> దిలీపు మిరియాల  
    (విత్తు, పరికరాల అమరిక, నిర్మాణం, పర్యవేక్షణ, సారధ్యం)
  </Typography>

  <Typography variant="body2" mb={2}>
    <strong>యంత్ర సహకారం:</strong> చంధం AI పరికరాలు
  </Typography>

  <Typography variant="body1" lineHeight={1.8}>
    తెలుగు సాహిత్య సౌరభాన్ని, ఉగాది పండుగ పరమార్థాన్ని కలబోస్తూ సాగిన ఈ <b>ఉగాది శతకం</b> ఒక అక్షర యాత్ర. 
    ప్రకృతిలో వచ్చే మార్పులు, షడ్రుచుల పచ్చడిలో దాగిన జీవన సత్యాలు, పంచాంగ శ్రవణం, పల్లెల్లోని కోలాహలం—
    ఇవన్నీ ఒక వైపు ఉంటే, రాబోయే పరాభవ నామ సంవత్సరానికి ఇచ్చిన అద్భుతమైన నిర్వచనం మరొక వైపు నిలుస్తుంది. 
    పరాభవం అంటే ఓటమి కాదు, అది <b>పర-భవం</b>—సరికొత్త, ఉన్నతమైన ఉనికి అని ఈ శతకం స్పష్టం చేస్తుంది. 
    ఆశావాదంతో అక్షర రూపం దాల్చిన 108 పద్యాల ఈ మాలిక, ప్రతి పద్యం చివర  <b>రా ఉగాది</b>  అనే ఆప్యాయ మకుటంతో 
    ఉగాదిని ఆహ్వానిస్తుంది.
  </Typography>

</Box>



      <Typography align="center" mb={3}>
      మొత్తం పద్యాలు: <strong>{poems.length}</strong>
      </Typography>

      {/* SEARCH */}

      <Stack spacing={2} mb={3}>

      <TextField
      label="పద్యం కోసం వెతకండి..."
      fullWidth
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      />

      <Stack direction="row" spacing={1} justifyContent="center">

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

      {/* POEMS */}
 {/* Download every currently-filtered poem's poster as one ZIP.
          THIS is the button that was missing — it did not exist anywhere
          in this file before. */}
      {!loading && !error && filtered.length > 0 && (

        <DownloadAllPosters
          poems={filtered}
          authors={AUTHORS}
          poetryName={POETRY_NAME}
        />

      )}
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