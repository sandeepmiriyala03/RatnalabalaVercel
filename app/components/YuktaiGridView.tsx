"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";

import {
  YuktaiGrid,
  type GridColumn,
  type WebMCPStatus,
  type GridTheme,
  type YuktaiGridRule,
} from "@yuktishaalaa/yuktai";

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

type PoemRow = {
  id: string;
  title: string;
  content: string;
  lines: number;
};

type Props = {
  poems: {
    title: string;
    content: string;
    slug?: string;
  }[];

  highlightIds?: string[];

  loading?: boolean;

  onOpenPoem: (title: string) => void;

  theme?: GridTheme;

  onThemeChange?: (theme: GridTheme) => void;

  /**
   * Additional application-specific Agent rules.
   * These are executed before the generic Grid Agent rules.
   */
  customRules?: YuktaiGridRule<PoemRow>[];
};

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const TOOL_PREFIX = "ratnalabala_poems";

const TELUGU_FONT =
  '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Vani", sans-serif';

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
/* WEBMCP                                                             */
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
  get_row: "వరుస",
  highlight: "హైలైట్",
  select: "ఎంచుకో",
  open: "తెరువు",
  filter: "ఫిల్టర్",
  clear_filters: "ఫిల్టర్లు",
  sort: "క్రమం",
  clear_sort: "క్రమం తొలగింపు",
};

/* ------------------------------------------------------------------ */
/* WEBMCP STATUS                                                      */
/* ------------------------------------------------------------------ */

const WEBMCP_TEXT: Record<WebMCPStatus["state"], string> = {
  unsupported:
    "ఈ బ్రౌజర్‌లో WebMCP అందుబాటులో లేదు.",
  registering:
    "AI tools నమోదవుతున్నాయి…",
  ready:
    "AI agents కోసం tools సిద్ధంగా ఉన్నాయి.",
  partial:
    "కొన్ని AI tools మాత్రమే నమోదయ్యాయి.",
  error:
    "AI tools నమోదు కాలేదు.",
};

/* ------------------------------------------------------------------ */
/* GRID THEMES                                                        */
/* ------------------------------------------------------------------ */

const THEME_OPTIONS: {
  value: GridTheme;
  label: string;
}[] = [
  {
    value: "default",
    label: "Default",
  },
  {
    value: "dark",
    label: "Dark Mode",
  },
  {
    value: "high-contrast",
    label: "High Contrast",
  },
  {
    value: "color-blind",
    label: "Color Blind",
  },
  {
    value: "dyslexia",
    label: "Dyslexia Friendly",
  },
];

/* ------------------------------------------------------------------ */
/* HELPER                                                             */
/* ------------------------------------------------------------------ */

function getQuestionHistory(
  history:
    | {
        id: number;
        tool: string;
        input: Record<string, unknown>;
        result: unknown;
        source: "tool" | "ask";
        at: number;
      }[]
    | undefined
) {
  if (!history?.length) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item.source === "ask" &&
        typeof item.input?.text === "string" &&
        String(item.input.text).trim().length > 0
    )
    .map((item) => String(item.input.text).trim());
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function YuktaiGridView({
  poems,
  highlightIds = [],
  loading = false,
  onOpenPoem,
  theme = "default",
  onThemeChange,
  customRules = [],
}: Props) {
  const muiTheme = useTheme();

  const isMobile = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const [webmcp, setWebmcp] =
    useState<WebMCPStatus | null>(null);

  const [lastAction, setLastAction] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  /* ================================================================ */
  /* GRID DATA                                                        */
  /* ================================================================ */

  const rows = useMemo<PoemRow[]>(
    () =>
      poems.map((poem) => {
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
    [poems]
  );

  /* ================================================================ */
  /* CUSTOM AGENT RULES                                               */
  /* ================================================================ */

  const agentRules = useMemo<
    YuktaiGridRule<PoemRow>[]
  >(
    () => [
      /* ------------------------------------------------------------ */
      /* SHOW QUESTION HISTORY — LIFO                                 */
      /* ------------------------------------------------------------ */

      {
        name: "show-question-history",

        phrases: [
          "నా ప్రశ్నలు",
          "ప్రశ్నలు చూపించు",
          "ప్రశ్నల హిస్టరీ",
          "చాట్ హిస్టరీ",
          "నా ప్రశ్నల హిస్టరీ",
          "చాట్ ప్రశ్నలు",
          "question history",
          "chat history",
          "my questions",
          "show questions",
        ],

        execute: async ({ history }) => {
          const questions =
            getQuestionHistory(history);

          if (!questions.length) {
            return "ఇంకా ప్రశ్నలు లేవు.";
          }

          /*
           * LIFO:
           * Latest question first.
           */
          const latestFirst = [...questions].reverse();

          return [
            "మీ తాజా ప్రశ్నలు:",
            "",
            ...latestFirst.map(
              (question, index) =>
                `${index + 1}. ${question}`
            ),
          ].join("\n");
        },
      },

      /* ------------------------------------------------------------ */
      /* LAST QUESTION                                                */
      /* ------------------------------------------------------------ */

      {
        name: "last-question",

        phrases: [
          "చివరి ప్రశ్న",
          "తాజా ప్రశ్న",
          "ఇప్పుడే అడిగిన ప్రశ్న",
          "last question",
          "latest question",
          "recent question",
        ],

        execute: async ({ history }) => {
          const questions =
            getQuestionHistory(history);

          const last =
            questions[questions.length - 1];

          return last
            ? `మీ చివరి ప్రశ్న:\n${last}`
            : "ఇంకా ప్రశ్నలు లేవు.";
        },
      },

      /* ------------------------------------------------------------ */
      /* PREVIOUS QUESTION                                            */
      /* ------------------------------------------------------------ */

      {
        name: "previous-question",

        phrases: [
          "మునుపటి ప్రశ్న",
          "గత ప్రశ్న",
          "దాని ముందు ప్రశ్న",
          "previous question",
          "prior question",
        ],

        execute: async ({ history }) => {
          const questions =
            getQuestionHistory(history);

          if (questions.length < 2) {
            return "మునుపటి ప్రశ్న లేదు.";
          }

          return [
            "మునుపటి ప్రశ్న:",
            questions[questions.length - 2],
          ].join("\n");
        },
      },

      /* ------------------------------------------------------------ */
      /* QUESTION COUNT                                               */
      /* ------------------------------------------------------------ */

      {
        name: "question-count",

        phrases: [
          "ఎన్ని ప్రశ్నలు",
          "ప్రశ్నల సంఖ్య",
          "మొత్తం ప్రశ్నలు",
          "how many questions",
          "question count",
        ],

        execute: async ({ history }) => {
          const questions =
            getQuestionHistory(history);

          return `మీరు ఇప్పటివరకు ${questions.length} ప్రశ్నలు అడిగారు.`;
        },
      },

      /* ------------------------------------------------------------ */
      /* CLEAR CHAT                                                    */
      /* ------------------------------------------------------------ */

      {
        name: "clear-chat",

        phrases: [
          "చాట్ క్లియర్ చేయి",
          "చాట్ క్లియర్",
          "చాట్ తొలగించు",
          "చాట్ హిస్టరీ క్లియర్ చేయి",
          "ప్రశ్నల హిస్టరీ క్లియర్ చేయి",
          "హిస్టరీ క్లియర్ చేయి",
          "చాట్ రీసెట్ చేయి",
          "clear chat",
          "clear history",
          "delete chat",
          "delete history",
          "reset chat",
        ],

        execute: async ({ clearHistory }) => {
          clearHistory?.();

          return "చాట్ హిస్టరీ క్లియర్ చేయబడింది.";
        },
      },

      /* ------------------------------------------------------------ */
      /* USER-PROVIDED RULES                                            */
      /* ------------------------------------------------------------ */

      ...customRules,
    ],
    [customRules]
  );

  /* ================================================================ */
  /* WEBMCP LABELS                                                    */
  /* ================================================================ */

  const registeredLabels = useMemo(
    () =>
      (webmcp?.registered ?? []).map((name) => {
        const id = name.startsWith(
          `${TOOL_PREFIX}_`
        )
          ? name.slice(
              TOOL_PREFIX.length + 1
            )
          : name;

        return TOOL_LABELS[id] ?? id;
      }),
    [webmcp]
  );

  /* ================================================================ */
  /* THEME                                                            */
  /* ================================================================ */

  const dark = theme === "dark";

  const gridBackground =
    theme === "dark"
      ? "#0f172a"
      : theme === "high-contrast"
        ? "#ffffff"
        : theme === "color-blind"
          ? "#f4f7ff"
          : theme === "dyslexia"
            ? "#fffdf5"
            : muiTheme.palette.background.paper;

  const gridText =
    theme === "dark"
      ? "#f8fafc"
      : "#0f172a";

  /* ================================================================ */
  /* UI                                                               */
  /* ================================================================ */

  return (
    <Stack
      spacing={{
        xs: 1.25,
        sm: 1.75,
        md: 2,
      }}
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        fontFamily: TELUGU_FONT,

        "& .MuiTypography-root": {
          fontFamily: TELUGU_FONT,
        },

        "& .MuiButtonBase-root": {
          fontFamily: TELUGU_FONT,
        },

        "& input, & textarea": {
          fontFamily: TELUGU_FONT,
        },
      }}
    >
      {/* ============================================================ */}
      {/* SUMMARY                                                      */}
      {/* ============================================================ */}

      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          p: {
            xs: 1.25,
            sm: 1.5,
          },
          borderRadius: {
            xs: 2,
            sm: 2.5,
          },
          border: `1px solid ${alpha(
            muiTheme.palette.divider,
            0.8
          )}`,
          backgroundColor:
            muiTheme.palette.background.paper,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.5,
              }}
            >
              రత్నాలబాల — AI Grid
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.25,
              }}
            >
              పద్యాలను AIతో వెతకండి, ప్రశ్నలు అడగండి
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              size="small"
              label={`పద్యాలు: ${rows.length}`}
            />

            <Chip
              size="small"
              variant="outlined"
              icon={<SmartToyRoundedIcon />}
              label="AI"
            />

            <Chip
              size="small"
              variant="outlined"
              icon={<HubRoundedIcon />}
              label="WebMCP"
            />
          </Stack>
        </Stack>
      </Box>

      {/* ============================================================ */}
      {/* THEME SELECTOR                                               */}
      {/* ============================================================ */}

      <Box
        sx={{
          width: "100%",
          p: {
            xs: 1.25,
            sm: 1.5,
          },
          borderRadius: {
            xs: 2,
            sm: 2.5,
          },
          border: `1px solid ${alpha(
            muiTheme.palette.divider,
            0.8
          )}`,
          backgroundColor:
            dark
              ? "#1e293b"
              : muiTheme.palette.background.paper,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.25}
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: dark
                  ? "#f8fafc"
                  : "text.primary",
              }}
            >
              Grid Theme
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: dark
                  ? "#cbd5e1"
                  : "text.secondary",
              }}
            >
              Accessibility theme
            </Typography>
          </Box>

          <FormControl
            size="small"
            fullWidth={isMobile}
            sx={{
              minWidth: {
                xs: "100%",
                sm: 230,
              },
              maxWidth: {
                xs: "100%",
                sm: 280,
              },
            }}
          >
            <InputLabel
              sx={{
                color: dark
                  ? "#cbd5e1"
                  : undefined,
              }}
            >
              Theme
            </InputLabel>

            <Select
              value={theme}
              label="Theme"
              onChange={(event) =>
                onThemeChange?.(
                  event.target.value as GridTheme
                )
              }
              sx={{
                minHeight: 44,
                fontFamily: TELUGU_FONT,

                color: dark
                  ? "#f8fafc"
                  : undefined,

                "& .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: dark
                      ? "#475569"
                      : undefined,
                  },

                "& .MuiSvgIcon-root": {
                  color: dark
                    ? "#f8fafc"
                    : undefined,
                },
              }}
            >
              {THEME_OPTIONS.map(
                (option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    sx={{
                      fontFamily:
                        TELUGU_FONT,
                      minHeight: 44,
                    }}
                  >
                    {option.label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* ============================================================ */}
      {/* AGENT QUICK INFO                                             */}
      {/* ============================================================ */}

      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          display: {
            xs: "none",
            sm: "block",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip
            size="small"
            variant="outlined"
            icon={
              <QuestionAnswerRoundedIcon />
            }
            label="ప్రశ్నలు"
          />

          <Chip
            size="small"
            variant="outlined"
            icon={
              <HistoryRoundedIcon />
            }
            label="LIFO History"
          />

          <Chip
            size="small"
            variant="outlined"
            icon={
              <DeleteSweepRoundedIcon />
            }
            label="Clear Chat"
          />
        </Stack>
      </Box>

      {/* ============================================================ */}
      {/* GRID                                                         */}
      {/* ============================================================ */}

      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",

          borderRadius: {
            xs: 2,
            sm: 3,
          },

          border: `1px solid ${alpha(
            muiTheme.palette.divider,
            0.8
          )}`,

          backgroundColor:
            gridBackground,

          color: gridText,

          boxShadow: {
            xs: "none",
            sm: `0 8px 30px ${alpha(
              muiTheme.palette.common.black,
              0.06
            )}`,
          },

          /*
           * Language selector is intentionally hidden.
           *
           * Ratnalabala uses Telugu as its fixed
           * Grid language/input language.
           */
          "& [data-yuktai-language-selector]":
            {
              display: "none !important",
            },

          "& [data-language-selector]": {
            display: "none !important",
          },

          /*
           * Prevent horizontal page overflow.
           */
          "& .ratnalabala-yuktai-grid": {
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          },
        }}
      >
        <YuktaiGrid<PoemRow>
          data={rows}
          columns={COLUMNS}
          rowKey="id"

          /* -------------------------------------------------------- */
          /* RESPONSIVE                                               */
          /* -------------------------------------------------------- */

          view="auto"
          mobileBreakpoint={768}

          /* -------------------------------------------------------- */
          /* ACCESSIBILITY                                            */
          /* -------------------------------------------------------- */

          theme={theme}

          /* Fixed Telugu */
          locale="te-IN"
          inputLanguage="te-IN"

          /* -------------------------------------------------------- */
          /* AGENT                                                    */
          /* -------------------------------------------------------- */

          customRules={agentRules}

          /* Page owns search */
          search={false}

          /* No selection checkboxes */
          selectable={false}

          /* -------------------------------------------------------- */
          /* PAGINATION                                               */
          /* -------------------------------------------------------- */

          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            sizeOptions: [
              10,
              20,
              50,
              100,
            ],
          }}

          loading={loading}

          /* -------------------------------------------------------- */
          /* HIGHLIGHT                                                */
          /* -------------------------------------------------------- */

          highlightIds={highlightIds}
          autoScrollToHighlight

          /* -------------------------------------------------------- */
          /* ROW OPEN                                                 */
          /* -------------------------------------------------------- */

          onRowClick={(row) =>
            onOpenPoem(row.title)
          }

          /* -------------------------------------------------------- */
          /* AI                                                       */
          /* -------------------------------------------------------- */

          ai

          /* -------------------------------------------------------- */
          /* WEBMCP                                                   */
          /* -------------------------------------------------------- */

          webmcp
          toolName={TOOL_PREFIX}
          toolDescriptions={TOOL_DESCRIPTIONS}

          onWebMCPStatusChange={
            setWebmcp
          }

          /* -------------------------------------------------------- */
          /* AGENT RESULT                                             */
          /* -------------------------------------------------------- */

          onAgentResult={(result) =>
            setLastAction({
              success: result.success,
              message: result.message,
            })
          }

          empty="పద్యాలు కనబడలేదు."

          className="ratnalabala-yuktai-grid"
        />
      </Box>

      {/* ============================================================ */}
      {/* LAST AGENT RESULT                                            */}
      {/* ============================================================ */}

      {lastAction && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            width: "100%",
            minWidth: 0,

            display: "flex",
            alignItems: "flex-start",
            gap: 1,

            px: {
              xs: 1.25,
              sm: 1.75,
            },

            py: {
              xs: 1.1,
              sm: 1.25,
            },

            borderRadius: 2,

            bgcolor: alpha(
              lastAction.success
                ? muiTheme.palette.success.main
                : muiTheme.palette.warning.main,
              0.08
            ),

            border: `1px solid ${alpha(
              lastAction.success
                ? muiTheme.palette.success.main
                : muiTheme.palette.warning.main,
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
            variant="body2"
            sx={{
              lineHeight: 1.75,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {lastAction.message}
          </Typography>
        </Box>
      )}

      {/* ============================================================ */}
      {/* WEBMCP STATUS                                                */}
      {/* ============================================================ */}

      {webmcp && (
        <Box
          sx={{
            width: "100%",
            minWidth: 0,

            px: {
              xs: 1.25,
              sm: 1.5,
            },

            py: {
              xs: 1.1,
              sm: 1.25,
            },

            borderRadius: 2,

            border: `1px dashed ${muiTheme.palette.divider}`,

            backgroundColor: alpha(
              muiTheme.palette.primary.main,
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
                lineHeight: 1.6,
              }}
            >
              WebMCP:{" "}
              {WEBMCP_TEXT[webmcp.state]}
            </Typography>
          </Stack>

          {/* REGISTERED TOOLS */}

          {registeredLabels.length > 0 && (
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              sx={{
                mt: 1,
              }}
            >
              {registeredLabels.map(
                (label) => (
                  <Chip
                    key={label}
                    size="small"
                    variant="outlined"
                    label={label}
                    sx={{
                      fontFamily:
                        TELUGU_FONT,
                    }}
                  />
                )
              )}
            </Stack>
          )}

          {/* WEBMCP ERRORS */}

          {webmcp.errors.length > 0 && (
            <Alert
              severity="warning"
              sx={{
                mt: 1,
                py: 0,
                fontFamily:
                  TELUGU_FONT,
              }}
            >
              {webmcp.errors
                .map(
                  (error) =>
                    error.tool
                )
                .join(", ")}{" "}
              నమోదు కాలేదు.
            </Alert>
          )}
        </Box>
      )}
    </Stack>
  );
}