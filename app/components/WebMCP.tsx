"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";

import HubRoundedIcon from "@mui/icons-material/HubRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

export default function WebMCP() {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("modelContext" in document)) {
      console.log("[WebMCP] WebMCP is not available.");
      return;
    }

    const modelContext = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: {
            name: string;
            title: string;
            description: string;
            inputSchema: Record<string, unknown>;
            annotations?: {
              readOnlyHint?: boolean;
            };
            execute: () => Promise<unknown>;
          }) => Promise<void>;
        };
      }
    ).modelContext;

    if (!modelContext) {
      console.log("[WebMCP] modelContext is not available.");
      return;
    }

    const registerTool = async () => {
      try {
        await modelContext.registerTool({
          name: "get_poem_list",

          title: "Get Ratnalabala Poem List",

          description:
            "Returns the list of Telugu poems available in Ratnalabala.",

          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },

          annotations: {
            readOnlyHint: true,
          },

          execute: async () => {
            const response = await fetch(
              "/api/getpoems?poet_id=1"
            );

            if (!response.ok) {
              throw new Error("Failed to load poems.");
            }

            const poems = await response.json();

            return {
              success: true,
              count: Object.keys(poems).length,
              poems: Object.keys(poems),
            };
          },
        });

        setReady(true);

        console.log(
          "[WebMCP] get_poem_list registered successfully."
        );
      } catch (err) {
        console.error(
          "[WebMCP] Tool registration failed:",
          err
        );

        setError("WebMCP tool registration failed.");
      }
    };

    registerTool();
  }, []);

  const testWebMCP = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      const modelContext = (
        document as Document & {
          modelContext?: {
            getTools: () => Promise<
              Array<{
                name: string;
              }>
            >;

            executeTool: (
              tool: unknown,
              input: Record<string, unknown>
            ) => Promise<unknown>;
          };
        }
      ).modelContext;

      if (!modelContext) {
        throw new Error("WebMCP is not available.");
      }

      const tools = await modelContext.getTools();

      const poemTool = tools.find(
        (tool) => tool.name === "get_poem_list"
      );

      if (!poemTool) {
        throw new Error(
          "get_poem_list tool was not found."
        );
      }

      const response =
        await modelContext.executeTool(
          poemTool,
          {}
        );

      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error(
        "[WebMCP] Execution failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "WebMCP execution failed."
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      {/* =====================================================
          WEBMCP BUTTON
         ===================================================== */}

      <Button
        fullWidth
        variant="outlined"
        color="secondary"
        onClick={() => setOpen((value) => !value)}
        startIcon={<HubRoundedIcon />}
        endIcon={
          open ? (
            <ExpandLessRoundedIcon />
          ) : (
            <ExpandMoreRoundedIcon />
          )
        }
        aria-expanded={open}
        aria-controls="webmcp-panel"
        sx={{
          minHeight: 52,
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        WebMCP
      </Button>

      {/* =====================================================
          WEBMCP FLOW
         ===================================================== */}

      <Collapse in={open} timeout={300}>
        <Box
          id="webmcp-panel"
          sx={{
            mt: 1.5,
            p: { xs: 2, sm: 2.5 },
            borderRadius: "14px",
            border: `1px solid ${alpha(
              theme.palette.secondary.main,
              0.25
            )}`,
            background: alpha(
              theme.palette.secondary.main,
              0.04
            ),
          }}
        >
          <Stack spacing={2}>
            {/* Header */}

            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
            >
              <HubRoundedIcon color="secondary" />

              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                  }}
                >
                  WebMCP AI Flow
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  AI can interact with Ratnalabala
                  through WebMCP tools.
                </Typography>
              </Box>
            </Stack>

            {/* =================================================
                FLOW
               ================================================= */}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(4, 1fr)",
                },
                gap: 1,
              }}
            >
              {/* AI */}

              <FlowStep
                icon={<SmartToyRoundedIcon />}
                title="1. AI"
                text="User asks a question"
              />

              {/* WebMCP */}

              <FlowStep
                icon={<HubRoundedIcon />}
                title="2. WebMCP"
                text="Selects the tool"
              />

              {/* API */}

              <FlowStep
                icon={<ApiRoundedIcon />}
                title="3. API"
                text="Calls Ratnalabala API"
              />

              {/* Database */}

              <FlowStep
                icon={<StorageRoundedIcon />}
                title="4. PostgreSQL"
                text="Returns poem data"
              />
            </Box>

            {/* =================================================
                TOOL
               ================================================= */}

            <Box
              sx={{
                p: 1.5,
                borderRadius: "12px",
                background:
                  theme.palette.background.paper,
                border: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.16
                )}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 700 }}
              >
                Registered WebMCP Tool
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontFamily: "monospace",
                  fontWeight: 700,
                }}
              >
                get_poem_list
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Returns the available Ratnalabala
                Telugu poems.
              </Typography>
            </Box>

            {/* =================================================
                STATUS
               ================================================= */}

            {ready ? (
              <Alert
                severity="success"
                icon={<CheckCircleRoundedIcon />}
              >
                WebMCP is ready — get_poem_list is
                registered.
              </Alert>
            ) : (
              <Alert severity="info">
                WebMCP is not available in this browser
                or has not been initialized yet.
              </Alert>
            )}

            {/* =================================================
                TEST BUTTON
               ================================================= */}

            <Button
              variant="contained"
              color="secondary"
              onClick={testWebMCP}
              disabled={!ready || testing}
              startIcon={
                testing ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <HubRoundedIcon />
                )
              }
              sx={{
                minHeight: 48,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {testing
                ? "Testing WebMCP..."
                : "Test WebMCP"}
            </Button>

            {/* =================================================
                RESULT
               ================================================= */}

            {result && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  background:
                    theme.palette.background.paper,
                  border: `1px solid ${alpha(
                    theme.palette.success.main,
                    0.3
                  )}`,
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  WebMCP Result
                </Typography>

                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "0.8rem",
                  }}
                >
                  {result}
                </Box>
              </Box>
            )}

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* =================================================
                USER EXAMPLE
               ================================================= */}

            <Box
              sx={{
                p: 1.5,
                borderRadius: "10px",
                background: alpha(
                  theme.palette.primary.main,
                  0.05
                ),
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Example
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                User: "ఏ పద్యాలు అందుబాటులో ఉన్నాయి?"
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                ↓ AI → WebMCP → get_poem_list
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                ↓ Ratnalabala API → PostgreSQL
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                ↓ 37 poems → AI response
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

/* ============================================================
   FLOW STEP
   ============================================================ */

function FlowStep({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "12px",
        textAlign: "center",
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(
          theme.palette.secondary.main,
          0.16
        )}`,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          mx: "auto",
          mb: 0.75,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "secondary.main",
          background: alpha(
            theme.palette.secondary.main,
            0.1
          ),
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "0.92rem",
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 0.35,
          lineHeight: 1.5,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}