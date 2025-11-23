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
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_unreasonable_thought",
        description: "Generate a new unreasonable thought that challenges conventional thinking. Efficiently creates thoughts without loading full context.",
        inputSchema: {
          type: "object",
          properties: {
            problem: {
              type: "string",
              description: "The problem or challenge to think unreasonably about"
            },
            previousThoughtId: {
              type: "string",
              description: "Optional ID of a previous thought to build upon or rebel against"
            },
            forceRebellion: {
              type: "boolean",
              description: "Force the thought to rebel against conventional wisdom"
            }
          },
          required: ["problem"]
        }
      },
      {
        name: "branch_thought",
        description: "Create a new branch of thinking from an existing thought. Returns only metadata, not full content.",
        inputSchema: {
          type: "object",
          properties: {
            thoughtId: {
              type: "string",
              description: "ID of the thought to branch from"
            },
            direction: {
              type: "string",
              description: "Direction for the new branch (e.g. 'more_extreme', 'opposite', 'tangential')"
            }
          },
          required: ["thoughtId", "direction"]
        }
      },
      {
        name: "search_thoughts",
        description: "Search for thought IDs by metadata. Returns only matching IDs and metadata, not full content. Enables efficient filtering.",
        inputSchema: {
          type: "object",
          properties: {
            branchId: {
              type: "string",
              description: "Optional branch ID to filter thoughts"
            },
            isRebellion: {
              type: "boolean",
              description: "Filter by rebellion status"
            },
            challengesAssumption: {
              type: "boolean",
              description: "Filter by assumption-challenging status"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 10)"
            }
          }
        }
      }
    ]
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
    contents: [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify(thought, null, 2),
    }],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_unreasonable_thought": {
      const { problem, previousThoughtId, forceRebellion } = request.params.arguments as any;

      const thoughtId = `thought_${Date.now()}`;
      const isRebellion = forceRebellion || Math.random() > 0.5;

      const thoughts = loadThoughts();
      let branchId;
      if (previousThoughtId) {
        const previousThought = thoughts[previousThoughtId];
        if (!previousThought) {
          throw new McpError(ErrorCode.InvalidParams, "Previous thought not found");
        }
        branchId = previousThought.branchId;
      }

      const thought: Thought = {
        id: thoughtId,
        content: generateUnreasonableThought(problem, previousThoughtId ? thoughts[previousThoughtId] : undefined),
        isRebellion,
        challengesAssumption: Math.random() > 0.3,
        branchFromThought: previousThoughtId,
        branchId,
        timestamp: Date.now()
      };

      thoughts[thoughtId] = thought;
      saveThoughts(thoughts);

      // Return only essential metadata, not full content - saves context
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtId,
            resourceUri: `thought://${thoughtId}`,
            isRebellion: thought.isRebellion,
            challengesAssumption: thought.challengesAssumption,
            branchInfo: thought.branchId ? `Branch: ${thought.branchId}` : "Main branch",
            message: "Thought generated. Use resource URI to access full content."
          }, null, 2)
        }]
      };
    }

    case "branch_thought": {
      const { thoughtId, direction } = request.params.arguments as any;
      const thoughts = loadThoughts();
      const sourceThought = thoughts[thoughtId];

      if (!sourceThought) {
        throw new McpError(ErrorCode.InvalidParams, "Source thought not found");
      }

      const newBranchId = `branch_${++branchCounter}`;
      const newThoughtId = `thought_${Date.now()}`;

      const thought: Thought = {
        id: newThoughtId,
        content: generateBranchedThought(sourceThought, direction),
        isRebellion: direction === 'opposite',
        challengesAssumption: true,
        branchFromThought: thoughtId,
        branchId: newBranchId,
        timestamp: Date.now()
      };

      thoughts[newThoughtId] = thought;
      saveThoughts(thoughts);

      // Return only metadata - the full thought content stays in the resource
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtId: newThoughtId,
            resourceUri: `thought://${newThoughtId}`,
            branchInfo: `New branch ${newBranchId} from thought ${thoughtId}`,
            direction,
            message: "New thought branch created. Use resource URI to access full content."
          }, null, 2)
        }]
      };
    }

    case "search_thoughts": {
      const { branchId, isRebellion, challengesAssumption, limit = 10 } = request.params.arguments as any || {};
      const thoughts = loadThoughts();

      // Filter at the server level - don't send unfiltered data to Claude
      const filtered = Object.values(thoughts)
        .filter(t => {
          if (branchId && t.branchId !== branchId) return false;
          if (isRebellion !== undefined && t.isRebellion !== isRebellion) return false;
          if (challengesAssumption !== undefined && t.challengesAssumption !== challengesAssumption) return false;
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      // Return only metadata - IDs and resource URIs, not full content
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            count: filtered.length,
            thoughts: filtered.map(t => ({
              id: t.id,
              resourceUri: `thought://${t.id}`,
              isRebellion: t.isRebellion,
              challengesAssumption: t.challengesAssumption,
              branchId: t.branchId || "main",
              timestamp: t.timestamp
            }))
          }, null, 2)
        }]
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
  }
});

function generateUnreasonableThought(problem: string, previousThought?: Thought): string {
  const unreasonableApproaches = [
    `What if we completely eliminated the concept of ${problem}?`,
    `Imagine if ${problem} operated in reverse - what opportunities would that create?`,
    `If we had infinite resources and no physical limitations, how would we solve ${problem}?`,
    `What if we combined ${problem} with its exact opposite?`,
    `How would an alien civilization with completely different logic solve ${problem}?`,
    `What if the opposite of "${problem}" is actually the better solution?`,
    `What if we scaled ${problem} up 1000x - what becomes possible?`,
    `What if we removed all constraints from ${problem} - what changes?`
  ];

  let thought = unreasonableApproaches[Math.floor(Math.random() * unreasonableApproaches.length)];

  if (previousThought) {
    thought = `Building on: ${previousThought.content}\n\nNew angle: ${thought}`;
  }

  return thought;
}

function generateBranchedThought(sourceThought: Thought, direction: string): string {
  switch (direction) {
    case 'more_extreme':
      return `Taking it further: ${sourceThought.content}\n→ What if we amplify this 1000x? What becomes possible?`;
    case 'opposite':
      return `Complete reversal: If the opposite of "${sourceThought.content}" were true, what would that imply?`;
    case 'tangential':
      return `Unexpected connection: ${sourceThought.content}\n→ How does this apply to a completely different domain?`;
    default:
      return `Building on: ${sourceThought.content}\n→ Taking this in a new direction...`;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Unconventional Thinking MCP server (v0.2.0) running on stdio");
  console.error("Context-efficient architecture: Returns metadata, stores content in resources");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});