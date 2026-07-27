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
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";

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
      రత్నాలబాల
      </Typography>

      <Typography align="center" mb={3}>
      మొత్తం పద్యాలు: <strong>{poems.length}</strong>
      </Typography>

      {/* RADIO — "own private FM station" player. Lives above search so
          it's the first thing visible; plays through whatever is
          currently filtered, same set the list/downloads below use. */}
      {!loading && !error && filtered.length > 0 && (

        <PoemRadio poems={filtered} />

      )}

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

      {/* Download every currently-filtered poem's VOICE audio as one
          ZIP — same idea as the poster ZIP above, but each file is a
          real live /api/tts call, not a free instant browser capture,
          so this one is genuinely slower for large collections. */}
      {!loading && !error && filtered.length > 0 && (

        <DownloadAllVoices poems={filtered} />

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