#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

interface Thought {
  id: string;
  content: string;
  isRebellion: boolean;
  challengesAssumption: boolean;
  branchFromThought?: string;
  branchId?: string;
  timestamp: number;
}

const thoughts: { [id: string]: Thought } = {};
let branchCounter = 0;

const server = new Server(
  {
    name: "unreasonable-thinking-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_unreasonable_thought",
        description: "Generate a new unreasonable thought that challenges conventional thinking",
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
        description: "Create a new branch of thinking from an existing thought",
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
        name: "list_thoughts",
        description: "List all thoughts in the current thinking session",
        inputSchema: {
          type: "object",
          properties: {
            branchId: {
              type: "string",
              description: "Optional branch ID to filter thoughts"
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_unreasonable_thought": {
      const { problem, previousThoughtId, forceRebellion } = request.params.arguments as any;
      
      const thoughtId = `thought_${Date.now()}`;
      const isRebellion = forceRebellion || Math.random() > 0.5;
      
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

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtId,
            thought: thought.content,
            isRebellion: thought.isRebellion,
            challengesAssumption: thought.challengesAssumption,
            branchInfo: thought.branchId ? `Branch: ${thought.branchId}` : "Main branch"
          }, null, 2)
        }]
      };
    }

    case "branch_thought": {
      const { thoughtId, direction } = request.params.arguments as any;
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

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtId: newThoughtId,
            thought: thought.content,
            branchInfo: `New branch ${newBranchId} from thought ${thoughtId}`,
            direction
          }, null, 2)
        }]
      };
    }

    case "list_thoughts": {
      const { branchId } = request.params.arguments as any || {};
      
      const filteredThoughts = Object.values(thoughts)
        .filter(t => !branchId || t.branchId === branchId)
        .sort((a, b) => a.timestamp - b.timestamp);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(filteredThoughts.map(t => ({
            id: t.id,
            thought: t.content,
            isRebellion: t.isRebellion,
            challengesAssumption: t.challengesAssumption,
            branchInfo: t.branchId ? `Branch: ${t.branchId}` : "Main branch"
          })), null, 2)
        }]
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
  }
});

function generateUnreasonableThought(problem: string, previousThought?: Thought): string {
  // This is a simplified example - in a real implementation, this would use more sophisticated
  // logic to generate truly unreasonable thoughts based on the problem and context
  const unreasonableApproaches = [
    `What if we completely eliminated the concept of ${problem}?`,
    `Imagine if ${problem} operated in reverse - what opportunities would that create?`,
    `If we had infinite resources and no physical limitations, how would we solve ${problem}?`,
    `What if we combined ${problem} with its exact opposite?`,
    `How would an alien civilization with completely different logic solve ${problem}?`
  ];

  return unreasonableApproaches[Math.floor(Math.random() * unreasonableApproaches.length)];
}

function generateBranchedThought(sourceThought: Thought, direction: string): string {
  // This would also be more sophisticated in a real implementation
  switch (direction) {
    case 'more_extreme':
      return `Taking it further: ${sourceThought.content} AND multiply it by 1000x`;
    case 'opposite':
      return `Complete reversal: What if the exact opposite of "${sourceThought.content}" is the answer?`;
    case 'tangential':
      return `Unexpected connection: ${sourceThought.content} but in a completely different context`;
    default:
      return `Building on: ${sourceThought.content} in a new direction`;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Unreasonable Thinking MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
