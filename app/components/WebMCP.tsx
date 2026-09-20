"use client";

import { useEffect, useState } from "react";

export default function WebMCP() {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<string>("");

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
      console.log(
        "[WebMCP] WebMCP is not available."
      );
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
                throw new Error(
                  "Failed to load poems."
                );
              }

              const poems =
                await response.json();

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
          "WebMCP is not available."
        );
      }

      const tools =
        await modelContext.getTools();

      console.log(
        "[WebMCP] Available tools:",
        tools
      );

      const tool = tools.find(
        (item) =>
          item.name === "get_poem_list"
      );

      if (!tool) {
        throw new Error(
          "get_poem_list was not found."
        );
      }

      const response =
        await modelContext.executeTool(
          tool,
          {}
        );

      console.log(
        "[WebMCP] Execution result:",
        response
      );

      setResult(
        JSON.stringify(
          response,
          null,
          2
        )
      );
    } catch (error) {
      console.error(
        "[WebMCP] Execution failed:",
        error
      );
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={testTool}
        disabled={!ready}
      >
        {ready
          ? "Test WebMCP"
          : "WebMCP Not Ready"}
      </button>

      {result && (
        <pre>
          {result}
        </pre>
      )}
    </div>
  );
}