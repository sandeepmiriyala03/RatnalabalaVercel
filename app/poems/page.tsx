"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";

import {
  YuktaiGrid,
  type GridColumn,
  type GridTheme,
  type WebMCPStatus,
} from "@yuktishaalaa/yuktai";

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

type Poem = {
  title: string;
  content: string;
  slug?: string;
};

type PoemRow = {
  id: string;
  title: string;
  content: string;
  lines: number;
};

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const POET_ID = 1;

const TOOL_PREFIX = "ratnalabala_poems";

const TELUGU_FONT =
  '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Vani", sans-serif';

const HELP_SEEN_KEY = "ratnalabala:grid-help-seen";

/* ------------------------------------------------------------------ */
/* GRID COLUMNS                                                       */
/* ------------------------------------------------------------------ */

const COLUMNS: GridColumn<PoemRow>[] = [
  {
    key: "title",
    label: "పద్యం పేరు",
    width: "32%",
  },
  {
    key: "content",
    label: "పద్యం",
    sortable: false,
    render: (value) => (
      <Box
        sx={{
          whiteSpace: "pre-line",
          fontFamily: TELUGU_FONT,
          lineHeight: 1.9,
          py: 0.5,
        }}
      >
        {String(value ?? "")}
      </Box>
    ),
  },
  {
    key: "lines",
    label: "పంక్తులు",
    type: "number",
    align: "center",
    width: 110,
  },
];

/* ------------------------------------------------------------------ */
/* WEBMCP TOOLS                                                       */
/* ------------------------------------------------------------------ */

const TOOL_DESCRIPTIONS = {
  search: "పద్యం పేరు లేదా పద్యంలో పదాన్ని వెతుకు.",
  open: "ఎంచుకున్న పద్యాన్ని తెరువు.",
  select: "ఒక పద్యాన్ని ఎంచుకో.",
  filter: "పద్యం పేరు, పద్యం లేదా పంక్తుల సంఖ్యతో ఫిల్టర్ చేయి.",
  sort: "పద్యాలను క్రమంలో అమర్చు.",
  count: "మొత్తం పద్యాల సంఖ్య చూపు.",
  columns: "పట్టిక కాలమ్‌లను చూపు.",
  get_row: "ఒక పద్య వరుస వివరాలు చూపు.",
  highlight: "ఒక పద్యాన్ని హైలైట్ చేయి.",
};

const TOOL_LABELS: Record<string, string> = {
  search: "వెతుకు",
  count: "లెక్క",
  columns: "కాలమ్‌లు",
  get_row: "వరుస చూపు",
  highlight: "హైలైట్",
  select: "ఎంచుకో",
  open: "తెరువు",
  filter: "ఫిల్టర్",
  clear_filters: "ఫిల్టర్లు తీసేయి",
  sort: "క్రమం",
  clear_sort: "క్రమం తీసేయి",
};

const WEBMCP_TEXT: Record<WebMCPStatus["state"], string> = {
  unsupported: "ఈ బ్రౌజర్‌లో WebMCP అందుబాటులో లేదు.",
  registering: "AI tools నమోదవుతున్నాయి…",
  ready: "AI agents కోసం tools సిద్ధంగా ఉన్నాయి.",
  partial: "కొన్ని AI tools మాత్రమే నమోదయ్యాయి.",
  error: "AI tools నమోదు కాలేదు.",
};

/* ------------------------------------------------------------------ */
/* HELP GUIDE                                                         */
/* ------------------------------------------------------------------ */

const HELP_STEPS: {
  icon: React.ReactNode;
  title: string;
  text: string;
}[] = [
  {
    icon: <SearchRoundedIcon />,
    title: "వెతకండి",
    text:
      "పై search boxలో పద్యం పేరు లేదా పద్యంలో ఉన్న పదాన్ని టైప్ చేయండి.",
  },
  {
    icon: <SmartToyRoundedIcon />,
    title: "AIతో అడగండి",
    text:
      "YuktAI Grid Agent ద్వారా పద్యాలను వెతకడం, లెక్కించడం, filter చేయడం, sort చేయడం వంటి grid పనులను సహజ భాషలో అడగవచ్చు.",
  },
  {
    icon: <RecordVoiceOverRoundedIcon />,
    title: "వాయిస్ ఉపయోగించండి",
    text:
      "AI Assistantలో microphone ఉపయోగించి Telugu లేదా అందుబాటులో ఉన్న ఇతర input languagesలో ప్రశ్న అడగవచ్చు.",
  },
  {
    icon: <SortRoundedIcon />,
    title: "క్రమబద్ధీకరించండి",
    text:
      "Column header ద్వారా sort చేయవచ్చు. Agentను కూడా “పంక్తుల ప్రకారం క్రమం” వంటి మాటలతో అడగవచ్చు.",
  },
  {
    icon: <TouchAppRoundedIcon />,
    title: "పద్యాన్ని తెరవండి",
    text:
      "ఒక పద్య వరుసను ఎంచుకుంటే ఆ పద్యాన్ని తెరవడానికి page callback ఉపయోగించబడుతుంది.",
  },
  {
    icon: <TableRowsRoundedIcon />,
    title: "Gridలో మరిన్ని",
    text:
      "Pagination, mobile card view, keyboard navigation, screen-reader support, highlighting మరియు responsive grid features అందుబాటులో ఉంటాయి.",
  },
  {
    icon: <HubRoundedIcon />,
    title: "WebMCP",
    text:
      "WebMCP అందుబాటులో ఉన్న browserలో AI agents కోసం grid tools register అవుతాయి.",
  },
];

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function PoemList() {
  const theme = useTheme();

  const [poems, setPoems] = useState<Poem[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [gridTheme, setGridTheme] = useState<GridTheme>("default");

  const [webmcp, setWebmcp] = useState<WebMCPStatus | null>(null);

  const [helpOpen, setHelpOpen] = useState(false);

  const [lastAction, setLastAction] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  /* -------------------------------------------------------------- */
  /* FIRST VISIT HELP                                               */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(HELP_SEEN_KEY);

      if (!seen) {
        setHelpOpen(true);

        window.localStorage.setItem(HELP_SEEN_KEY, "1");
      }
    } catch {
      // Ignore localStorage failures.
    }
  }, []);

  /* -------------------------------------------------------------- */
  /* LOAD POEMS                                                      */
  /* -------------------------------------------------------------- */

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/getpoems?poet_id=${POET_ID}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load poems");
      }

      const data: Record<string, string> = await response.json();

      setPoems(
        Object.entries(data).map(([title, content]) => ({
          title,
          content,
          slug: `db-${title}`,
        }))
      );
    } catch (err) {
      console.error("Error loading poems:", err);

      setError("పద్యాలను లోడ్ చేయడంలో లోపం సంభవించింది.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPoems();
  }, [loadPoems]);

  /* -------------------------------------------------------------- */
  /* SEARCH                                                         */
  /* -------------------------------------------------------------- */

  const query = search.trim();

  const filteredPoems = useMemo(() => {
    if (!query) {
      return poems;
    }

    const q = query.toLocaleLowerCase();

    return poems.filter(
      (poem) =>
        poem.title.toLocaleLowerCase().includes(q) ||
        poem.content.toLocaleLowerCase().includes(q)
    );
  }, [poems, query]);

  /* -------------------------------------------------------------- */
  /* GRID DATA                                                       */
  /* -------------------------------------------------------------- */

  const rows = useMemo<PoemRow[]>(
    () =>
      filteredPoems.map((poem) => {
        const lines = poem.content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        return {
          id: poem.slug ?? poem.title,
          title: poem.title,
          content: lines.join("\n"),
          lines: lines.length,
        };
      }),
    [filteredPoems]
  );

  /* -------------------------------------------------------------- */
  /* GRID ROW OPEN                                                   */
  /* -------------------------------------------------------------- */

  const openPoem = useCallback((row: PoemRow) => {
    /*
     * Keep your existing navigation behavior here.
     *
     * If your current application has a route,
     * replace this with router.push(...).
     *
     * For now the event is exposed through the
     * browser custom event so this component remains
     * reusable.
     */
    window.dispatchEvent(
      new CustomEvent("ratnalabala:open-poem", {
        detail: {
          title: row.title,
          id: row.id,
        },
      })
    );
  }, []);

  /* -------------------------------------------------------------- */
  /* REGISTERED WEBMCP LABELS                                       */
  /* -------------------------------------------------------------- */

  const registeredLabels = useMemo(
    () =>
      (webmcp?.registered ?? []).map((name) => {
        const id = name.startsWith(`${TOOL_PREFIX}_`)
          ? name.slice(TOOL_PREFIX.length + 1)
          : name;

        return TOOL_LABELS[id] ?? id;
      }),
    [webmcp]
  );

  /* -------------------------------------------------------------- */
  /* SEARCH CLEAR                                                   */
  /* -------------------------------------------------------------- */

  const clearSearch = () => {
    setSearch("");
  };

  /* -------------------------------------------------------------- */
  /* UI                                                              */
  /* -------------------------------------------------------------- */

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        px: {
          xs: 1.25,
          sm: 2,
          md: 3,
        },
        py: {
          xs: 1.5,
          sm: 2.5,
          md: 3,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        {/* ====================================================== */}
        {/* HEADER                                                  */}
        {/* ====================================================== */}

        <Stack
          spacing={1}
          sx={{
            mb: {
              xs: 1.5,
              sm: 2,
            },
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontFamily: TELUGU_FONT,
              fontSize: {
                xs: "1.65rem",
                sm: "2rem",
                md: "2.3rem",
              },
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "text.primary",
            }}
          >
            రత్నాలబాల
          </Typography>

          <Typography
            sx={{
              fontFamily: TELUGU_FONT,
              fontSize: {
                xs: "0.9rem",
                sm: "1rem",
              },
              color: "text.secondary",
              lineHeight: 1.6,
            }}
          >
            పద్యాలను వెతకండి, చదవండి మరియు AIతో ప్రశ్నించండి
          </Typography>
        </Stack>

        {/* ====================================================== */}
        {/* SEARCH                                                  */}
        {/* ====================================================== */}

        <Box
          sx={{
            position: "sticky",
            top: {
              xs: 8,
              sm: 12,
            },
            zIndex: 20,
            mb: 1.5,
          }}
        >
          <TextField
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="పద్యం పేరు లేదా పద్యంలో వెతకండి…"
            aria-label="పద్యం వెతకండి"
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon
                    sx={{
                      color: "primary.main",
                      fontSize: {
                        xs: 24,
                        sm: 27,
                      },
                    }}
                  />
                </InputAdornment>
              ),

              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="వెతుకును క్లియర్ చేయండి"
                    onClick={clearSearch}
                    edge="end"
                    sx={{
                      minWidth: 44,
                      minHeight: 44,
                    }}
                  >
                    <ClearRoundedIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,

              sx: {
                minHeight: {
                  xs: 54,
                  sm: 60,
                },
                borderRadius: {
                  xs: 2.5,
                  sm: 3,
                },
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  0.96
                ),
                backdropFilter: "blur(12px)",
              },
            }}
          />

          {/* SEARCH RESULT COUNT */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              mt: 0.75,
              px: 0.5,
              minHeight: 28,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              role="status"
              aria-live="polite"
              sx={{
                fontFamily: TELUGU_FONT,
              }}
            >
              {loading
                ? "పద్యాలు లోడ్ అవుతున్నాయి…"
                : query
                  ? `${filteredPoems.length} / ${poems.length} పద్యాలు`
                  : `మొత్తం ${poems.length} పద్యాలు`}
            </Typography>

            {query && (
              <Button
                size="small"
                onClick={clearSearch}
                sx={{
                  minHeight: 36,
                  textTransform: "none",
                  fontFamily: TELUGU_FONT,
                  fontWeight: 700,
                }}
              >
                క్లియర్
              </Button>
            )}
          </Stack>
        </Box>

        {/* ====================================================== */}
        {/* HELP GUIDE                                              */}
        {/* ====================================================== */}

        <Box
          sx={{
            mb: 1.5,
            borderRadius: {
              xs: 2,
              sm: 2.5,
            },
            border: `1px solid ${alpha(
              theme.palette.primary.main,
              0.16
            )}`,
            backgroundColor: alpha(
              theme.palette.primary.main,
              0.035
            ),
            overflow: "hidden",
          }}
        >
          <Button
            fullWidth
            onClick={() => setHelpOpen((value) => !value)}
            aria-expanded={helpOpen}
            aria-controls="grid-help"
            startIcon={<HelpOutlineRoundedIcon />}
            endIcon={
              helpOpen ? (
                <ExpandLessRoundedIcon />
              ) : (
                <ExpandMoreRoundedIcon />
              )
            }
            sx={{
              minHeight: {
                xs: 50,
                sm: 54,
              },
              px: {
                xs: 1.5,
                sm: 2,
              },
              justifyContent: "space-between",
              textTransform: "none",
              fontFamily: TELUGU_FONT,
              fontWeight: 700,
              fontSize: {
                xs: "0.95rem",
                sm: "1rem",
              },
              color: "primary.main",
            }}
          >
            <Box
              component="span"
              sx={{
                flex: 1,
                textAlign: "left",
              }}
            >
              ఈ Grid ఎలా వాడాలి?
            </Box>
          </Button>

          <Collapse in={helpOpen} timeout={300}>
            <Box
              id="grid-help"
              sx={{
                px: {
                  xs: 1.5,
                  sm: 2.5,
                },
                pb: {
                  xs: 1.75,
                  sm: 2.5,
                },
              }}
            >
              <Stack
                spacing={{
                  xs: 1.5,
                  sm: 2,
                }}
              >
                {HELP_STEPS.map((step, index) => (
                  <Stack
                    key={step.title}
                    direction="row"
                    spacing={1.25}
                    alignItems="flex-start"
                  >
                    <Box
                      aria-hidden
                      sx={{
                        flex: "0 0 auto",
                        width: {
                          xs: 36,
                          sm: 40,
                        },
                        height: {
                          xs: 36,
                          sm: 40,
                        },
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "primary.main",
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.1
                        ),
                      }}
                    >
                      {step.icon}
                    </Box>

                    <Box sx={{ pt: 0.1 }}>
                      <Typography
                        sx={{
                          fontFamily: TELUGU_FONT,
                          fontWeight: 750,
                          fontSize: {
                            xs: "0.9rem",
                            sm: "0.95rem",
                          },
                          mb: 0.2,
                        }}
                      >
                        {index + 1}. {step.title}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: TELUGU_FONT,
                          fontSize: {
                            xs: "0.84rem",
                            sm: "0.9rem",
                          },
                          lineHeight: 1.7,
                          color: "text.secondary",
                        }}
                      >
                        {step.text}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setHelpOpen(false)}
                sx={{
                  mt: 2,
                  minHeight: 46,
                  borderRadius: 2,
                  textTransform: "none",
                  fontFamily: TELUGU_FONT,
                  fontWeight: 700,
                }}
              >
                అర్థమైంది
              </Button>
            </Box>
          </Collapse>
        </Box>

        {/* ====================================================== */}
        {/* ERROR                                                   */}
        {/* ====================================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 1.5,
              borderRadius: 2,
              fontFamily: TELUGU_FONT,
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={loadPoems}
                sx={{
                  fontFamily: TELUGU_FONT,
                  fontWeight: 700,
                }}
              >
                మళ్ళీ ప్రయత్నించండి
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* ====================================================== */}
        {/* GRID                                                     */}
        {/* ====================================================== */}

        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            borderRadius: {
              xs: 2,
              sm: 3,
            },
            overflow: "hidden",
            border: `1px solid ${alpha(
              theme.palette.divider,
              0.8
            )}`,
            backgroundColor:
              gridTheme === "dark"
                ? "#0f172a"
                : gridTheme === "high-contrast"
                  ? "#ffffff"
                  : gridTheme === "color-blind"
                    ? "#f4f7ff"
                    : gridTheme === "dyslexia"
                      ? "#fffdf5"
                      : theme.palette.background.paper,
            boxShadow: {
              xs: "none",
              sm: `0 8px 30px ${alpha(
                theme.palette.common.black,
                0.06
              )}`,
            },
          }}
        >
          <YuktaiGrid<PoemRow>
            data={rows}
            columns={COLUMNS}
            rowKey="id"

            /*
             * Responsive automatic view.
             */
            view="auto"
            mobileBreakpoint={768}

            /*
             * Accessibility themes.
             */
            theme={gridTheme}

            /*
             * UI language.
             */
            locale="te-IN"

            /*
             * Voice / input language.
             */
            inputLanguage="te-IN"

            /*
             * Next.js page does not receive arbitrary props.
             * Application-specific rules can be defined inside
             * this page when required.
             */
            customRules={[]}

            /*
             * Page already owns the single
             * search box above the grid.
             *
             * Agent search still works through
             * the Agent / WebMCP tool pipeline.
             */
            search={false}

            /*
             * Keep grid interactions available.
             */
            selectable

            /*
             * Responsive pagination.
             */
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              sizeOptions: [10, 20, 50, 100],
            }}

            loading={loading}

            /*
             * Highlight support.
             */
            highlightIds={[]}
            autoScrollToHighlight

            /*
             * Row interaction.
             */
            onRowClick={openPoem}

            /*
             * Agentic AI.
             */
            ai

            /*
             * WebMCP.
             */
            webmcp

            toolName={TOOL_PREFIX}

            toolDescriptions={TOOL_DESCRIPTIONS}

            onWebMCPStatusChange={setWebmcp}

            /*
             * Agent result.
             */
            onAgentResult={(result) => {
              setLastAction({
                success: result.success,
                message: result.message,
              });
            }}

            empty={
              query
                ? "ఈ వెతుకులో పద్యాలు కనబడలేదు."
                : "పద్యాలు కనబడలేదు."
            }

            className="ratnalabala-yuktai-grid"
          />
        </Box>

        {/* ====================================================== */}
        {/* AGENT RESULT                                             */}
        {/* ====================================================== */}

        {lastAction && (
          <Box
            role="status"
            aria-live="polite"
            sx={{
              mt: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              px: {
                xs: 1.25,
                sm: 1.75,
              },
              py: {
                xs: 1,
                sm: 1.25,
              },
              borderRadius: 2,
              bgcolor: alpha(
                lastAction.success
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                0.08
              ),
              border: `1px solid ${alpha(
                lastAction.success
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                0.18
              )}`,
            }}
          >
            <SmartToyRoundedIcon
              fontSize="small"
              color={
                lastAction.success
                  ? "success"
                  : "warning"
              }
            />

            <Typography
              sx={{
                fontFamily: TELUGU_FONT,
                fontSize: {
                  xs: "0.85rem",
                  sm: "0.9rem",
                },
                lineHeight: 1.7,
              }}
            >
              {lastAction.message}
            </Typography>
          </Box>
        )}

        {/* ====================================================== */}
        {/* WEBMCP STATUS                                            */}
        {/* ====================================================== */}

        {webmcp && (
          <Box
            sx={{
              mt: 1.5,
              px: {
                xs: 1.25,
                sm: 1.5,
              },
              py: {
                xs: 1,
                sm: 1.25,
              },
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              backgroundColor: alpha(
                theme.palette.primary.main,
                0.025
              ),
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <HubRoundedIcon
                fontSize="small"
                color={
                  webmcp.state === "ready"
                    ? "success"
                    : "disabled"
                }
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontFamily: TELUGU_FONT,
                  lineHeight: 1.6,
                }}
              >
                WebMCP: {WEBMCP_TEXT[webmcp.state]}
              </Typography>
            </Stack>

            {registeredLabels.length > 0 && (
              <Stack
                direction="row"
                spacing={0.75}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 1 }}
              >
                {registeredLabels.map((label) => (
                  <Box
                    key={label}
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.4,
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(
                        theme.palette.divider,
                        0.8
                      )}`,
                      fontFamily: TELUGU_FONT,
                      fontSize: "0.75rem",
                    }}
                  >
                    {label}
                  </Box>
                ))}
              </Stack>
            )}

            {webmcp.errors.length > 0 && (
              <Alert
                severity="warning"
                sx={{
                  mt: 1,
                  py: 0,
                  fontFamily: TELUGU_FONT,
                }}
              >
                {webmcp.errors
                  .map((error) => error.tool)
                  .join(", ")}{" "}
                నమోదు కాలేదు.
              </Alert>
            )}
          </Box>
        )}

        {/* ====================================================== */}
        {/* LOADING                                                  */}
        {/* ====================================================== */}

        {loading && (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{
              mt: 1.5,
              py: 1,
            }}
          >
            <CircularProgress size={20} />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontFamily: TELUGU_FONT,
              }}
            >
              పద్యాలు లోడ్ అవుతున్నాయి…
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}