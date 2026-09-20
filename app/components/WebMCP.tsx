"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import HubRoundedIcon from "@mui/icons-material/HubRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

export default function WebMCP() {
  const theme = useTheme();

  const [ready, setReady] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showEnableGuide, setShowEnableGuide] = useState(false);

  useEffect(() => {
    const modelContext = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              title?: string;
              description: string;
              inputSchema: Record<string, unknown>;
              annotations?: {
                readOnlyHint?: boolean;
              };
              execute: (
                input: Record<string, unknown>
              ) => Promise<unknown>;
            },
            options?: {
              signal?: AbortSignal;
            }
          ) => Promise<void>;
        };
      }
    ).modelContext;

    if (!modelContext) {
      console.log("[WebMCP] WebMCP is not available.");
      return;
    }

    const controller = new AbortController();

    const registerTool = async () => {
      try {
        await modelContext.registerTool(
          {
            name: "get_poem_list",

            title: "Get Ratnalabala Poem List",

            description:
              "Returns the list of Telugu poems currently available in Ratnalabala.",

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
          },
          {
            signal: controller.signal,
          }
        );

        setReady(true);

        console.log(
          "[WebMCP] get_poem_list registered successfully."
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(
          "[WebMCP] Tool registration failed:",
          error
        );
      }
    };

    registerTool();

    return () => {
      controller.abort();
    };
  }, []);

  const testTool = async () => {
    try {
      setTesting(true);
      setError("");
      setResult("");
      setShowResult(false);

      const modelContext = (
        document as Document & {
          modelContext?: {
            getTools: () => Promise<
              Array<{
                name: string;
                inputSchema?: unknown;
              }>
            >;

            executeTool: (
              tool: unknown,
              input?: Record<string, unknown>
            ) => Promise<unknown>;
          };
        }
      ).modelContext;

      if (!modelContext) {
        throw new Error(
          "WebMCP is not available in this browser."
        );
      }

      const tools = await modelContext.getTools();

      console.log(
        "[WebMCP] Available tools:",
        tools
      );

      const tool = tools.find(
        (item) => item.name === "get_poem_list"
      );

      if (!tool) {
        throw new Error(
          "get_poem_list was not found."
        );
      }

      const response =
        await modelContext.executeTool(tool, {});

      console.log(
        "[WebMCP] Execution result:",
        response
      );

      setResult(
        JSON.stringify(response, null, 2)
      );

      setShowResult(true);
    } catch (error) {
      console.error(
        "[WebMCP] Execution failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "WebMCP execution failed."
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        overflow: "hidden",
        borderRadius: "16px",
        border: `1px solid ${alpha(
          theme.palette.secondary.main,
          0.22
        )}`,
        background: `linear-gradient(
          145deg,
          ${alpha(theme.palette.secondary.main, 0.055)},
          ${alpha(theme.palette.primary.main, 0.025)}
        )`,
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          background: alpha(
            theme.palette.secondary.main,
            0.055
          ),
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "secondary.main",
              background: alpha(
                theme.palette.secondary.main,
                0.12
              ),
            }}
          >
            <HubRoundedIcon />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.08rem",
              }}
            >
              WebMCP
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              AI access to Ratnalabala
            </Typography>
          </Box>

          <Chip
            size="small"
            icon={
              ready ? (
                <CheckCircleRoundedIcon />
              ) : undefined
            }
            label={
              ready
                ? "Connected"
                : "Not Connected"
            }
            color={ready ? "success" : "default"}
            variant="outlined"
            sx={{
              fontWeight: 700,
              display: {
                xs: "none",
                sm: "flex",
              },
            }}
          />
        </Stack>
      </Box>

      <Divider />

      {/* BODY */}

      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack spacing={2}>

          {/* STATUS */}

          {ready ? (
            <Alert
              severity="success"
              icon={<CheckCircleRoundedIcon />}
              sx={{
                borderRadius: "12px",
                alignItems: "center",
              }}
            >
              <strong>WebMCP connected.</strong>{" "}
              The tool{" "}
              <strong>get_poem_list</strong> is ready.
            </Alert>
          ) : (
            <Alert
              severity="warning"
              sx={{
                borderRadius: "12px",
              }}
            >
              WebMCP is not available or has not
              been initialized yet.
            </Alert>
          )}

          {/* HOW TO ENABLE */}

          {!ready && (
            <Box>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={() =>
                  setShowEnableGuide(
                    (value) => !value
                  )
                }
                startIcon={<SettingsRoundedIcon />}
                endIcon={
                  showEnableGuide ? (
                    <ExpandLessRoundedIcon />
                  ) : (
                    <ExpandMoreRoundedIcon />
                  )
                }
                sx={{
                  minHeight: 48,
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                How to Enable WebMCP
              </Button>

              <Collapse in={showEnableGuide}>
                <Box
                  sx={{
                    mt: 1.25,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: "14px",
                    background: alpha(
                      theme.palette.warning.main,
                      0.05
                    ),
                    border: `1px solid ${alpha(
                      theme.palette.warning.main,
                      0.25
                    )}`,
                  }}
                >
                  <Stack spacing={1.75}>

                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "1rem",
                      }}
                    >
                      Enable WebMCP in Chrome
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      WebMCP is currently an
                      experimental browser feature.
                    </Typography>

                    {/* STEP 1 */}

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                      >
                        1. Open Chrome WebMCP settings
                      </Typography>

                      <Box
                        sx={{
                          mt: 0.75,
                          p: 1.25,
                          borderRadius: "8px",
                          background:
                            theme.palette
                              .background.paper,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: "0.8rem",
                          wordBreak: "break-all",
                        }}
                      >
                        chrome://flags/#enable-webmcp-testing
                      </Box>
                    </Box>

                    {/* STEP 2 */}

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                      >
                        2. Enable WebMCP
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Find the WebMCP option and
                        change it from{" "}
                        <strong>Default</strong> to{" "}
                        <strong>Enabled</strong>.
                      </Typography>
                    </Box>

                    {/* STEP 3 */}

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                      >
                        3. Relaunch Chrome
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Click{" "}
                        <strong>Relaunch</strong> at the
                        bottom of the Chrome flags page.
                      </Typography>
                    </Box>

                    {/* STEP 4 */}

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                      >
                        4. Open Ratnalabala again
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Refresh this page after Chrome
                        restarts.
                      </Typography>
                    </Box>

                    {/* STEP 5 */}

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                      >
                        5. Verify the WebMCP tool
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Open:
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                        }}
                      >
                        F12 → Application → WebMCP
                      </Typography>

                      <Chip
                        icon={<HubRoundedIcon />}
                        label="get_poem_list"
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{
                          mt: 1,
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: "10px",
                      }}
                    >
                      WebMCP is an experimental browser
                      feature. If the WebMCP option is
                      unavailable, update Chrome and try
                      again.
                    </Alert>

                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() =>
                        window.location.reload()
                      }
                      sx={{
                        minHeight: 46,
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Refresh & Check WebMCP
                    </Button>
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* FLOW */}

          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                mb: 1.25,
              }}
            >
              How it works
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(4, 1fr)",
                },
                gap: 1,
              }}
            >
              <FlowStep
                icon={<SmartToyRoundedIcon />}
                title="AI"
                text="Understands"
              />

              <FlowStep
                icon={<HubRoundedIcon />}
                title="WebMCP"
                text="Selects tool"
              />

              <FlowStep
                icon={<ApiRoundedIcon />}
                title="API"
                text="Gets data"
              />

              <FlowStep
                icon={<StorageRoundedIcon />}
                title="PostgreSQL"
                text="Returns poems"
              />
            </Box>
          </Box>

          {/* TOOL INFORMATION */}

          <Box
            sx={{
              p: 1.5,
              borderRadius: "12px",
              background:
                theme.palette.background.paper,
              border: `1px solid ${alpha(
                theme.palette.divider,
                0.8
              )}`,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <HubRoundedIcon
                fontSize="small"
                color="secondary"
              />

              <Typography
                variant="body2"
                sx={{ fontWeight: 800 }}
              >
                Registered Tool
              </Typography>
            </Stack>

            <Typography
              sx={{
                mt: 0.75,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              get_poem_list
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Read-only • Returns available Telugu
              poems
            </Typography>
          </Box>

          {/* TEST */}

          <Button
            fullWidth
            variant="contained"
            color="secondary"
            disabled={!ready || testing}
            onClick={testTool}
            startIcon={
              testing ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <PlayArrowRoundedIcon />
              )
            }
            sx={{
              minHeight: 50,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.98rem",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            {testing
              ? "Running WebMCP..."
              : "Test WebMCP"}
          </Button>

          {/* RESULT */}

          {result && (
            <Box>
              <Button
                fullWidth
                variant="text"
                onClick={() =>
                  setShowResult(
                    (value) => !value
                  )
                }
                endIcon={
                  showResult ? (
                    <ExpandLessRoundedIcon />
                  ) : (
                    <ExpandMoreRoundedIcon />
                  )
                }
                sx={{
                  justifyContent: "space-between",
                  minHeight: 44,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                WebMCP Result
              </Button>

              <Collapse in={showResult}>
                <Box
                  sx={{
                    mt: 0.75,
                    p: 1.5,
                    maxHeight: 280,
                    overflow: "auto",
                    borderRadius: "10px",
                    background:
                      theme.palette.background.paper,
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                  }}
                >
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.78rem",
                      lineHeight: 1.6,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    {result}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* ERROR */}

          {error && (
            <Alert
              severity="error"
              sx={{
                borderRadius: "12px",
              }}
            >
              {error}
            </Alert>
          )}

          {/* EXAMPLE */}

          <Box
            sx={{
              p: 1.5,
              borderRadius: "12px",
              background: alpha(
                theme.palette.primary.main,
                0.045
              ),
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                mb: 0.5,
              }}
            >
              Example
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7 }}
            >
              “ఏ పద్యాలు అందుబాటులో ఉన్నాయి?”
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                lineHeight: 1.7,
              }}
            >
              AI →{" "}
              <strong>get_poem_list</strong> →
              Ratnalabala API → PostgreSQL
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
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
        p: 1.25,
        minWidth: 0,
        textAlign: "center",
        borderRadius: "12px",
        background:
          theme.palette.background.paper,
        border: `1px solid ${alpha(
          theme.palette.secondary.main,
          0.14
        )}`,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          mx: "auto",
          mb: 0.75,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "secondary.main",
          background: alpha(
            theme.palette.secondary.main,
            0.09
          ),
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "0.86rem",
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
      >
        {text}
      </Typography>
    </Box>
  );
}