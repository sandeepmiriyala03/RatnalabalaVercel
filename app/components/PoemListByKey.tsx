
"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  Stack,
  Collapse,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";

import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

import PoemCardNew from "@/app/components/PoemCardNew";

import { POETRY_COLLECTIONS } from "@/types/poetry";

import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";


/* ================================================================
   TYPES
================================================================ */

interface Poem {
  title: string;
  content: string;
  slug?: string;

  // Python main.py fields
  filename?: string;
  author?: string;
}

interface PythonPoem {
  title: string;
  author?: string;
  text: string;
  filename: string;
}

interface PythonPoemsResponse {
  success: boolean;
  collection: string;
  count: number;
  poems: PythonPoem[];
}

interface Props {
  apiKey: string;
  poetryName: string;
  authors: string | string[];
}


/* ================================================================
   CONFIG
================================================================ */

const ITEMS_PER_PAGE = 10;


/* ================================================================
   COMPONENT
================================================================ */

const PoemListByKey: React.FC<Props> = ({
  apiKey,
  poetryName,
  authors,
}) => {
  const [poems, setPoems] = useState<Poem[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [viewAll, setViewAll] = useState(false);

  const [toolsOpen, setToolsOpen] = useState(false);


  /* ================================================================
     SORT
  ================================================================= */

  const sortPoems = (list: Poem[]) => {
    return [...list].sort((a, b) => {
      const n = (text: string) => {
        const match = text.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };

      return n(a.title) - n(b.title);
    });
  };


  /* ================================================================
     PYTHON API
     
     GET:
     /api/main?endpoint=poems&collection=Sumati
  ================================================================= */

  const fetchCollection = async (
    collectionKey: string
  ): Promise<Poem[]> => {
    const url =
      `/api/main?endpoint=poems&collection=` +
      encodeURIComponent(collectionKey);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to load collection: ${collectionKey}`
      );
    }

    const data: PythonPoemsResponse =
      await response.json();

    if (!data.success) {
      throw new Error(
        `Python API failed for ${collectionKey}`
      );
    }

    return (data.poems || []).map((poem) => ({
      title: poem.title,

      content: poem.text,

      filename: poem.filename,

      author: poem.author,

      slug: `${collectionKey}-${poem.filename}`,
    }));
  };


  /* ================================================================
     LOAD POEMS
     
     IMPORTANT:
     Old:
       /api/shatakamu?key=Sumati

     New:
       /api/main?endpoint=poems&collection=Sumati
  ================================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchPoems = async () => {
      setLoading(true);
      setError(null);

      try {
        /* ==========================================================
           CASE 1: ALL COLLECTIONS
        ========================================================== */

        if (apiKey === "all") {
          const collections =
            POETRY_COLLECTIONS.filter(
              (p) => p.key !== "all"
            );

          const responses = await Promise.all(
            collections.map((collection) =>
              fetchCollection(collection.key)
            )
          );

          const merged: Poem[] = responses.flatMap(
            (collectionPoems, index) => {
              const collection =
                collections[index];

              return collectionPoems.map(
                (poem) => ({
                  ...poem,

                  title:
                    `${collection.label} – ${poem.title}`,

                  slug:
                    `${collection.key}-${poem.filename}`,
                })
              );
            }
          );

          if (!cancelled) {
            setPoems(
              sortPoems(merged)
            );
          }

          return;
        }


        /* ==========================================================
           CASE 2: SINGLE COLLECTION
        ========================================================== */

        const collectionPoems =
          await fetchCollection(apiKey);

        if (!cancelled) {
          setPoems(
            sortPoems(collectionPoems)
          );
        }

      } catch (err) {
        console.error(
          "[PoemListByKey] Failed:",
          err
        );

        if (!cancelled) {
          setError(
            "పద్యాలను లోడ్ చేయడంలో లోపం వచ్చింది."
          );

          setPoems([]);
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPoems();

    return () => {
      cancelled = true;
    };

  }, [apiKey]);


  /* ================================================================
     SEARCH
  ================================================================= */

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return poems;
    }

    return poems.filter((poem) =>
      poem.title
        .toLowerCase()
        .includes(query) ||
      poem.content
        .toLowerCase()
        .includes(query)
    );

  }, [poems, search]);


  /* ================================================================
     PAGINATION
  ================================================================= */

  const itemsPerPage =
    viewAll
      ? Math.max(filtered.length, 1)
      : ITEMS_PER_PAGE;

  const totalPages =
    Math.ceil(
      filtered.length / itemsPerPage
    ) || 1;

  const current =
    filtered.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );

  const rangeStart =
    filtered.length === 0
      ? 0
      : (page - 1) * itemsPerPage + 1;

  const rangeEnd =
    Math.min(
      page * itemsPerPage,
      filtered.length
    );


  /* ================================================================
     RESET PAGE
  ================================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    viewAll,
    apiKey,
  ]);


  /* ================================================================
     PAGE CHANGE
  ================================================================= */

  const handlePageChange = (
    _event: unknown,
    value: number
  ) => {
    setPage(value);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* ================================================================
     UI
  ================================================================= */

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
        },
        maxWidth: 900,
        mx: "auto",
      }}
    >

      {/* ==========================================================
          TITLE
      ========================================================== */}

      <Typography
        align="center"
        fontWeight={700}
        fontSize="1.8rem"
      >
        {poetryName}
      </Typography>


      <Typography
        align="center"
        sx={{ mb: 2 }}
        color="text.secondary"
      >
        మొత్తం పద్యాలు:{" "}
        <strong>
          {filtered.length}
        </strong>
      </Typography>


      {/* ==========================================================
          SEARCH
      ========================================================== */}

      <TextField
        label="పద్యం కోసం వెతకండి..."
        fullWidth
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        sx={{ mb: 2 }}

        slotProps={{
          input: {
            endAdornment:
              search && (
                <InputAdornment position="end">

                  <IconButton
                    size="small"
                    aria-label="వెతకడం క్లియర్ చేయండి"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    <ClearRoundedIcon
                      fontSize="small"
                    />
                  </IconButton>

                </InputAdornment>
              ),
          },
        }}
      />


      {/* ==========================================================
          VIEW ALL
      ========================================================== */}

      <Box
        textAlign="center"
        mb={3}
      >
        <Button
          variant={
            viewAll
              ? "outlined"
              : "contained"
          }
          onClick={() =>
            setViewAll((value) => !value)
          }
          disabled={
            loading ||
            filtered.length === 0
          }
        >
          {viewAll
            ? "పేజీలవారీగా చూడండి"
            : "అన్ని పద్యాలు చూడండి"}
        </Button>
      </Box>


      {/* ==========================================================
          LOADING
      ========================================================== */}

      {loading && (
        <Stack
          alignItems="center"
          spacing={1.5}
          sx={{ py: 6 }}
        >
          <CircularProgress size={32} />

          <Typography
            color="text.secondary"
          >
            పద్యాలు లోడ్ అవుతున్నాయి…
          </Typography>
        </Stack>
      )}


      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error && (
        <Typography
          align="center"
          color="error"
          sx={{ py: 4 }}
        >
          {error}
        </Typography>
      )}


      {/* ==========================================================
          EMPTY SEARCH
      ========================================================== */}

      {!loading &&
        !error &&
        filtered.length === 0 && (
          <Stack
            alignItems="center"
            spacing={1}
            sx={{
              py: 6,
              opacity: 0.75,
            }}
          >

            <SearchOffRoundedIcon
              fontSize="large"
              color="disabled"
            />

            <Typography
              color="text.secondary"
            >
              &ldquo;{search}&rdquo;
              కోసం ఏ పద్యం దొరకలేదు.
            </Typography>

            <Button
              size="small"
              onClick={() =>
                setSearch("")
              }
            >
              వెతకడం క్లియర్ చేయండి
            </Button>

          </Stack>
        )}


      {/* ==========================================================
          POEM RADIO
      ========================================================== */}

      {!loading &&
        !error &&
        filtered.length > 0 && (
          <PoemRadio
            poems={filtered}
          />
        )}


      {/* ==========================================================
          BULK DOWNLOAD TOOLS
      ========================================================== */}

      {!loading &&
        !error &&
        filtered.length > 0 && (

          <Box sx={{ mb: 3 }}>

            <Button
              onClick={() =>
                setToolsOpen(
                  (value) => !value
                )
              }
              variant="outlined"
              fullWidth

              startIcon={
                <DownloadForOfflineRoundedIcon
                  fontSize="small"
                />
              }

              endIcon={
                toolsOpen ? (
                  <ExpandLessRoundedIcon
                    fontSize="small"
                  />
                ) : (
                  <ExpandMoreRoundedIcon
                    fontSize="small"
                  />
                )
              }

              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "10px",
              }}
            >
              బల్క్ డౌన్‌లోడ్‌లు
              {" "}
              (పోస్టర్లు · వాయిస్‌లు · వీడియోలు)
            </Button>


            <Collapse
              in={toolsOpen}
              timeout={280}
              unmountOnExit
            >
              <Stack
                spacing={2}
                sx={{ mt: 2 }}
              >

                <DownloadAllPosters
                  poems={filtered}
                  authors={authors}
                  poetryName={poetryName}
                />

                <DownloadAllVideos
                  poems={filtered}
                />

                <DownloadAllVoices
                  poems={filtered}
                />

              </Stack>
            </Collapse>

          </Box>
        )}


      {/* ==========================================================
          POEMS
      ========================================================== */}

      {!loading &&
        !error &&
        current.map((poem) => (

          <PoemCardNew
            key={poem.slug}
            poem={poem}
            authors={authors}
            poetryName={poetryName}
          />

        ))}


      {/* ==========================================================
          PAGINATION
      ========================================================== */}

      {!loading &&
        !error &&
        filtered.length > 0 && (

          <>

            {!viewAll &&
              totalPages > 1 && (

                <>

                  <Typography
                    align="center"
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 3 }}
                  >
                    {rangeStart}–{rangeEnd}
                    {" / "}
                    {filtered.length}
                    {" "}
                    పద్యాలు చూపిస్తున్నాం
                  </Typography>


                  <Box
                    display="flex"
                    justifyContent="center"
                    mt={1}
                  >
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={
                        handlePageChange
                      }
                    />
                  </Box>

                </>
              )}

          </>
        )}

    </Box>
  );
};
export default PoemListByKey;
