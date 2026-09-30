"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";

import {
  YuktaiGrid,
  type GridColumn,
  type WebMCPStatus,
  type GridTheme,
} from "@yuktishaalaa/yuktai";

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
};

const TOOL_PREFIX = "ratnalabala_poems";

const TELUGU_FONT =
  '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Vani", sans-serif';

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
    hiddenOnMobile: true,
    render: (value) => (
      <Box
        sx={{
          whiteSpace: "pre-line",
          fontFamily: TELUGU_FONT,
          lineHeight: 1.9,
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
    width: 100,
  },
];

const TOOL_DESCRIPTIONS = {
  search:
    "Search Telugu poems by title or poem text. Matching poems are highlighted.",
  open: "Open a Telugu poem by its ID and show the complete poem.",
  select: "Select a poem by its ID.",
  filter: "Filter poems by title, text, or number of lines.",
  sort: "Sort poems by title or number of lines.",
  count: "Count the poems currently available.",
  columns: "Show the available poem table columns.",
  get_row: "Get one poem row by its ID.",
  highlight: "Highlight a poem row by its ID.",
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

export default function YuktaiGridView({
  poems,
  highlightIds = [],
  loading = false,
  onOpenPoem,
  theme = "default",
}: Props) {
  const muiTheme = useTheme();

  const [webmcp, setWebmcp] = useState<WebMCPStatus | null>(null);

  const [lastAction, setLastAction] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  return (
    <Stack
      spacing={{ xs: 1.25, sm: 1.75 }}
      sx={{
        width: "100%",
        minWidth: 0,
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
      {/* GRID SUMMARY */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        alignItems="center"
      >
        <Chip
          size="small"
          label={`మొత్తం పద్యాలు: ${rows.length}`}
        />

        <Chip
          size="small"
          variant="outlined"
          label="AI Grid"
          icon={<SmartToyRoundedIcon />}
        />
      </Stack>

      {/* GRID */}
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          borderRadius: { xs: 2, sm: 3 },
          overflow: "hidden",

          border: `1px solid ${alpha(
            muiTheme.palette.divider,
            0.8
          )}`,

          backgroundColor:
            theme === "dark"
              ? "#0f172a"
              : theme === "high-contrast"
                ? "#ffffff"
                : theme === "color-blind"
                  ? "#f4f7ff"
                  : theme === "dyslexia"
                    ? "#fffdf5"
                    : muiTheme.palette.background.paper,

          color:
            theme === "dark"
              ? "#f8fafc"
              : "#0f172a",

          boxShadow: {
            xs: "none",
            sm: `0 8px 30px ${alpha(
              muiTheme.palette.common.black,
              0.06
            )}`,
          },
        }}
      >
        <YuktaiGrid<PoemRow>
          data={rows}
          columns={COLUMNS}
          rowKey="id"
          view="auto"
          mobileBreakpoint={768}
          theme={theme}
          locale="te-IN"
          inputLanguage="te-IN"
          search={false}
          selectable={false}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            sizeOptions: [10, 20, 50, 100],
          }}
          loading={loading}
          highlightIds={highlightIds}
          autoScrollToHighlight
          onRowClick={(row) => onOpenPoem(row.title)}
          ai
          webmcp
          toolName={TOOL_PREFIX}
          toolDescriptions={TOOL_DESCRIPTIONS}
          onWebMCPStatusChange={setWebmcp}
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

      {/* AGENT RESULT */}
      {lastAction && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            px: { xs: 1.25, sm: 1.75 },
            py: { xs: 1.1, sm: 1.25 },
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
              fontFamily: TELUGU_FONT,
              lineHeight: 1.7,
            }}
          >
            {lastAction.message}
          </Typography>
        </Box>
      )}

      {/* WEBMCP STATUS */}
      {webmcp && (
        <Box
          sx={{
            px: { xs: 1.25, sm: 1.5 },
            py: { xs: 1.1, sm: 1.25 },
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
                fontFamily: TELUGU_FONT,
                lineHeight: 1.6,
              }}
            >
              WebMCP: {WEBMCP_TEXT[webmcp.state]}
            </Typography>
          </Stack>

          {/* REGISTERED TOOLS */}
          {registeredLabels.length > 0 && (
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 1 }}
            >
              {registeredLabels.map((label) => (
                <Chip
                  key={label}
                  size="small"
                  variant="outlined"
                  label={label}
                  sx={{
                    fontFamily: TELUGU_FONT,
                  }}
                />
              ))}
            </Stack>
          )}

          {/* WEBMCP ERRORS */}
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
    </Stack>
  );
}