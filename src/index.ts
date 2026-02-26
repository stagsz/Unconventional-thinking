#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface Thought {
  id: string;
  content: string;
  isRebellion: boolean;
  challengesAssumption: boolean;
  branchFromThought?: string;
  branchId?: string;
  timestamp: number;
}

const DATA_DIR = path.join(process.cwd(), ".thoughts");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const THOUGHTS_FILE = path.join(DATA_DIR, "thoughts.json");
let branchCounter = 0;

function loadThoughts(): { [id: string]: Thought } {
  if (fs.existsSync(THOUGHTS_FILE)) {
    return JSON.parse(fs.readFileSync(THOUGHTS_FILE, "utf-8"));
  }
  return {};
}

function saveThoughts(thoughts: { [id: string]: Thought }) {
  fs.writeFileSync(THOUGHTS_FILE, JSON.stringify(thoughts, null, 2));
}

const server = new Server(
  {
    name: "unconventional-thinking-server",
    version: "0.3.0",
  },
  {
    capabilities: {
      // listChanged: true signals the server can notify clients when tools change
      tools: {
        listChanged: true,
      },
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_unreasonable_thought",
        // title: human-readable display name (MCP spec 2025-11-25)
        title: "Generate Unreasonable Thought",
        description:
          "Generate a new unreasonable thought that challenges conventional thinking. Efficiently creates thoughts without loading full context.",
        // annotations: hints about tool behaviour for clients and safety UIs (MCP spec 2025-11-25)
        annotations: {
          readOnlyHint: false,       // writes a new thought to storage
          destructiveHint: false,    // only adds data, never deletes
          idempotentHint: false,     // each call produces a distinct thought
          openWorldHint: false,      // operates only on local .thoughts storage
        },
        inputSchema: {
          type: "object",
          properties: {
            problem: {
              type: "string",
              description: "The problem or challenge to think unreasonably about",
            },
            previousThoughtId: {
              type: "string",
              description:
                "Optional ID of a previous thought to build upon or rebel against",
            },
            forceRebellion: {
              type: "boolean",
              description:
                "Force the thought to rebel against conventional wisdom",
            },
          },
          required: ["problem"],
        },
        // outputSchema: validates structuredContent returned by the tool (MCP spec 2025-11-25)
        outputSchema: {
          type: "object",
          properties: {
            thoughtId: {
              type: "string",
              description: "Unique identifier for the generated thought",
            },
            isRebellion: {
              type: "boolean",
              description:
                "Whether the thought rebels against conventional wisdom",
            },
            challengesAssumption: {
              type: "boolean",
              description: "Whether the thought challenges core assumptions",
            },
            branchInfo: {
              type: "string",
              description: "Branch context for the thought",
            },
          },
          required: ["thoughtId", "isRebellion", "challengesAssumption", "branchInfo"],
        },
      },
      {
        name: "branch_thought",
        title: "Branch a Thought",
        description:
          "Create a new branch of thinking from an existing thought. Returns only metadata, not full content.",
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          type: "object",
          properties: {
            thoughtId: {
              type: "string",
              description: "ID of the thought to branch from",
            },
            direction: {
              type: "string",
              description:
                "Direction for the new branch ('more_extreme', 'opposite', 'tangential')",
              enum: ["more_extreme", "opposite", "tangential"],
            },
          },
          required: ["thoughtId", "direction"],
        },
        outputSchema: {
          type: "object",
          properties: {
            thoughtId: {
              type: "string",
              description: "Unique identifier for the new branched thought",
            },
            branchInfo: {
              type: "string",
              description: "Description of the branch relationship",
            },
            direction: {
              type: "string",
              description: "The branching direction applied",
            },
          },
          required: ["thoughtId", "branchInfo", "direction"],
        },
      },
      {
        name: "search_thoughts",
        title: "Search Thoughts",
        description:
          "Search for thought IDs by metadata. Returns only matching IDs and metadata, not full content. Enables efficient filtering.",
        annotations: {
          readOnlyHint: true,    // only reads, never writes
          openWorldHint: false,  // operates only on local .thoughts storage
        },
        inputSchema: {
          type: "object",
          properties: {
            branchId: {
              type: "string",
              description: "Optional branch ID to filter thoughts",
            },
            isRebellion: {
              type: "boolean",
              description: "Filter by rebellion status",
            },
            challengesAssumption: {
              type: "boolean",
              description: "Filter by assumption-challenging status",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 10)",
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            count: {
              type: "number",
              description: "Number of thoughts matching the filter",
            },
            thoughts: {
              type: "array",
              description: "List of matching thought metadata entries",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  isRebellion: { type: "boolean" },
                  challengesAssumption: { type: "boolean" },
                  branchId: { type: "string" },
                  timestamp: { type: "number" },
                },
              },
            },
          },
          required: ["count", "thoughts"],
        },
      },
    ],
  };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const thoughts = loadThoughts();
  const resources = Object.entries(thoughts).map(([id, thought]) => ({
    uri: `thought://${id}`,
    name: `Thought: ${id}`,
    description: `Thought from ${new Date(thought.timestamp).toISOString()}, rebellion: ${thought.isRebellion}`,
    mimeType: "application/json",
  }));

  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^thought:\/\/(.+)$/);

  if (!match) {
    throw new McpError(ErrorCode.InvalidParams, "Invalid resource URI");
  }

  const thoughtId = match[1];
  const thoughts = loadThoughts();
  const thought = thoughts[thoughtId];

  if (!thought) {
    throw new McpError(ErrorCode.InvalidParams, "Thought not found");
  }

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(thought, null, 2),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_unreasonable_thought": {
      const { problem, previousThoughtId, forceRebellion } =
        request.params.arguments as any;

      const thoughtId = `thought_${Date.now()}`;
      const isRebellion = forceRebellion || Math.random() > 0.5;

      const thoughts = loadThoughts();
      let branchId: string | undefined;

      if (previousThoughtId) {
        const previousThought = thoughts[previousThoughtId];
        if (!previousThought) {
          // Tool execution error: use isError rather than a protocol-level McpError
          return {
            content: [
              {
                type: "text" as const,
                text: `Previous thought not found: ${previousThoughtId}`,
              },
            ],
            isError: true,
          };
        }
        branchId = previousThought.branchId;
      }

      const thought: Thought = {
        id: thoughtId,
        content: generateUnreasonableThought(
          problem,
          previousThoughtId ? thoughts[previousThoughtId] : undefined
        ),
        isRebellion,
        challengesAssumption: Math.random() > 0.3,
        branchFromThought: previousThoughtId,
        branchId,
        timestamp: Date.now(),
      };

      thoughts[thoughtId] = thought;
      saveThoughts(thoughts);

      const structured = {
        thoughtId,
        isRebellion: thought.isRebellion,
        challengesAssumption: thought.challengesAssumption,
        branchInfo: thought.branchId ? `Branch: ${thought.branchId}` : "Main branch",
      };

      // resource_link lets the client know it can directly fetch the full thought
      // structuredContent provides typed output matching outputSchema (MCP spec 2025-11-25)
      return {
        content: [
          {
            // resource_link: explicit link to the resource (MCP spec 2025-11-25)
            type: "resource_link" as const,
            uri: `thought://${thoughtId}`,
            name: `Thought ${thoughtId}`,
            description: `${thought.isRebellion ? "Rebellious" : "Conventional"} thought — read resource for full content`,
            mimeType: "application/json",
          },
          {
            // Text fallback with serialised structuredContent for backwards compatibility
            type: "text" as const,
            text: JSON.stringify(structured, null, 2),
          },
        ],
        // structuredContent: machine-readable output conforming to outputSchema
        structuredContent: structured,
      };
    }

    case "branch_thought": {
      const { thoughtId, direction } = request.params.arguments as any;
      const thoughts = loadThoughts();
      const sourceThought = thoughts[thoughtId];

      if (!sourceThought) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Source thought not found: ${thoughtId}`,
            },
          ],
          isError: true,
        };
      }

      const newBranchId = `branch_${++branchCounter}`;
      const newThoughtId = `thought_${Date.now()}`;

      const thought: Thought = {
        id: newThoughtId,
        content: generateBranchedThought(sourceThought, direction),
        isRebellion: direction === "opposite",
        challengesAssumption: true,
        branchFromThought: thoughtId,
        branchId: newBranchId,
        timestamp: Date.now(),
      };

      thoughts[newThoughtId] = thought;
      saveThoughts(thoughts);

      const structured = {
        thoughtId: newThoughtId,
        branchInfo: `New branch ${newBranchId} from thought ${thoughtId}`,
        direction,
      };

      return {
        content: [
          {
            type: "resource_link" as const,
            uri: `thought://${newThoughtId}`,
            name: `Thought ${newThoughtId}`,
            description: `Branched thought (${direction}) — read resource for full content`,
            mimeType: "application/json",
          },
          {
            type: "text" as const,
            text: JSON.stringify(structured, null, 2),
          },
        ],
        structuredContent: structured,
      };
    }

    case "search_thoughts": {
      const {
        branchId,
        isRebellion,
        challengesAssumption,
        limit = 10,
      } = (request.params.arguments as any) || {};
      const thoughts = loadThoughts();

      // Filter at the server level — don't send unfiltered data to the model
      const filtered = Object.values(thoughts)
        .filter((t) => {
          if (branchId && t.branchId !== branchId) return false;
          if (isRebellion !== undefined && t.isRebellion !== isRebellion)
            return false;
          if (
            challengesAssumption !== undefined &&
            t.challengesAssumption !== challengesAssumption
          )
            return false;
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      const structured = {
        count: filtered.length,
        thoughts: filtered.map((t) => ({
          id: t.id,
          isRebellion: t.isRebellion,
          challengesAssumption: t.challengesAssumption,
          branchId: t.branchId || "main",
          timestamp: t.timestamp,
        })),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(structured, null, 2),
          },
        ],
        structuredContent: structured,
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
  }
});

function generateUnreasonableThought(
  problem: string,
  previousThought?: Thought
): string {
  const unreasonableApproaches = [
    `What if we completely eliminated the concept of ${problem}?`,
    `Imagine if ${problem} operated in reverse - what opportunities would that create?`,
    `If we had infinite resources and no physical limitations, how would we solve ${problem}?`,
    `What if we combined ${problem} with its exact opposite?`,
    `How would an alien civilization with completely different logic solve ${problem}?`,
    `What if the opposite of "${problem}" is actually the better solution?`,
    `What if we scaled ${problem} up 1000x - what becomes possible?`,
    `What if we removed all constraints from ${problem} - what changes?`,
  ];

  let thought =
    unreasonableApproaches[
      Math.floor(Math.random() * unreasonableApproaches.length)
    ];

  if (previousThought) {
    thought = `Building on: ${previousThought.content}\n\nNew angle: ${thought}`;
  }

  return thought;
}

function generateBranchedThought(
  sourceThought: Thought,
  direction: string
): string {
  switch (direction) {
    case "more_extreme":
      return `Taking it further: ${sourceThought.content}\n\u2192 What if we amplify this 1000x? What becomes possible?`;
    case "opposite":
      return `Complete reversal: If the opposite of "${sourceThought.content}" were true, what would that imply?`;
    case "tangential":
      return `Unexpected connection: ${sourceThought.content}\n\u2192 How does this apply to a completely different domain?`;
    default:
      return `Building on: ${sourceThought.content}\n\u2192 Taking this in a new direction...`;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Unconventional Thinking MCP server (v0.3.0) running on stdio");
  console.error(
    "MCP spec 2025-11-25: tool titles, annotations, outputSchema, structuredContent, resource_link"
  );
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
