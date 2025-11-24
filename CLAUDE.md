# CLAUDE.md - AI Assistant Development Guide

This document provides comprehensive guidance for AI assistants working with the Unconventional Thinking Server codebase.

## Project Overview

**Name**: Unconventional Thinking Server (unreasnable-thinker-server)
**Version**: 0.2.0
**Type**: MCP (Model Context Protocol) Server
**Purpose**: A context-efficient tool for generating and tracking unconventional, boundary-breaking problem-solving thoughts

This is a TypeScript-based MCP server that implements an unconventional thinking system optimized for **context space savings** based on Anthropic's latest MCP architecture patterns. The server demonstrates recommended patterns for reducing context overhead by 98.7%.

## Repository Structure

```
Unconventional-thinking/
├── src/
│   └── index.ts              # Main server implementation (all logic in single file)
├── .thoughts/
│   └── thoughts.json         # Persistent storage for generated thoughts
├── build/                    # Compiled JavaScript output (gitignored)
├── node_modules/             # Dependencies (gitignored)
├── package.json              # Project metadata and scripts
├── tsconfig.json             # TypeScript configuration
├── .gitignore                # Git ignore patterns
├── README.md                 # User-facing documentation
├── LICENSE                   # MIT License
└── CLAUDE.md                 # This file - AI assistant guide
```

## Core Architecture Principles

### 1. Context-Efficient Design
The server is built around minimizing token usage in Claude conversations:

- **Resources API**: Thought content stored as resources (`thought://[id]`), loaded only when explicitly needed
- **Metadata-First Returns**: Tools return only IDs, URIs, and brief metadata (not full content)
- **Server-Side Filtering**: `search_thoughts` filters locally instead of passing unfiltered data to Claude
- **Persistent Storage**: File-based storage in `.thoughts/` directory prevents in-memory bloat

### 2. Data Model

**Thought Interface** (src/index.ts:16-24):
```typescript
interface Thought {
  id: string;                    // Unique identifier (e.g., "thought_1763929421891")
  content: string;               // The actual thought text
  isRebellion: boolean;          // Whether it rebels against conventional wisdom
  challengesAssumption: boolean; // Whether it challenges core assumptions
  branchFromThought?: string;    // Optional: ID of parent thought
  branchId?: string;             // Optional: Branch identifier
  timestamp: number;             // Unix timestamp of creation
}
```

Storage format: JSON object with thought IDs as keys in `.thoughts/thoughts.json`

## Technical Stack

### Dependencies
- **Runtime**: Node.js with ES2022 target
- **MCP SDK**: `@modelcontextprotocol/sdk@0.6.0` - Core protocol implementation
- **TypeScript**: `^5.3.3` - Type safety and compilation
- **Node Types**: `@types/node@^20.11.24` - Node.js type definitions

### TypeScript Configuration
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Module Resolution**: Node16
- **Compiler Target**: ES2022
- **Strict Mode**: Enabled (strict type checking)
- **Output Directory**: `./build`
- **Source Directory**: `./src`

### Build System
The project uses TypeScript compiler (tsc) with a post-build chmod:
```bash
tsc && node -e "require('fs').chmodSync('build/index.js', '755')"
```
This makes the compiled binary executable for direct invocation.

## MCP Server Implementation

### Server Capabilities (src/index.ts:45-56)
```typescript
{
  name: "unconventional-thinking-server",
  version: "0.2.0",
  capabilities: {
    tools: {},      // Provides 3 tools
    resources: {}   // Provides thought:// resources
  }
}
```

### Tools

#### 1. `generate_unreasonable_thought` (src/index.ts:169-212)
**Purpose**: Generate new unconventional thoughts that challenge conventional thinking

**Parameters**:
- `problem` (required): The problem/challenge to think unconventionally about
- `previousThoughtId` (optional): ID of a previous thought to build upon or rebel against
- `forceRebellion` (optional): Force the thought to rebel against conventional wisdom

**Returns**: Metadata only (not full content)
```json
{
  "thoughtId": "thought_1763929421891",
  "resourceUri": "thought://thought_1763929421891",
  "isRebellion": true,
  "challengesAssumption": true,
  "branchInfo": "Main branch",
  "message": "Thought generated. Use resource URI to access full content."
}
```

**Implementation Notes**:
- Uses template-based generation (8 unreasonable approaches)
- Randomly assigns `isRebellion` (50% chance) unless forced
- Randomly assigns `challengesAssumption` (70% chance)
- Can build upon previous thoughts if `previousThoughtId` provided
- Saves to persistent storage immediately

#### 2. `branch_thought` (src/index.ts:214-252)
**Purpose**: Create new branches of thinking from existing thoughts

**Parameters**:
- `thoughtId` (required): ID of the thought to branch from
- `direction` (required): Direction for branch ('more_extreme', 'opposite', 'tangential')

**Returns**: Branch metadata only
```json
{
  "thoughtId": "thought_1763929657966",
  "resourceUri": "thought://thought_1763929657966",
  "branchInfo": "New branch branch_1 from thought thought_1763929421891",
  "direction": "more_extreme",
  "message": "New thought branch created. Use resource URI to access full content."
}
```

**Implementation Notes**:
- Creates new `branchId` using incrementing counter
- Sets `isRebellion=true` for 'opposite' direction
- Always sets `challengesAssumption=true` for branches
- Uses direction-specific templates (src/index.ts:314-325)

#### 3. `search_thoughts` (src/index.ts:254-286)
**Purpose**: Search for thoughts by metadata (server-side filtering)

**Parameters** (all optional):
- `branchId`: Filter by specific branch ID
- `isRebellion`: Filter by rebellion status (boolean)
- `challengesAssumption`: Filter by assumption-challenging status (boolean)
- `limit`: Maximum results to return (default: 10)

**Returns**: Filtered thought metadata (not content)
```json
{
  "count": 2,
  "thoughts": [
    {
      "id": "thought_1763929657966",
      "resourceUri": "thought://thought_1763929657966",
      "isRebellion": true,
      "challengesAssumption": true,
      "branchId": "main",
      "timestamp": 1763929657966
    }
  ]
}
```

**Implementation Notes**:
- Filters at server level (doesn't send unfiltered data to Claude)
- Sorts by timestamp (newest first)
- Applies limit to control result size
- This is the key context-saving pattern

### Resources (src/index.ts:130-165)

**Resource Pattern**: `thought://[thoughtId]`

**ListResources Handler**:
- Returns metadata for all thoughts
- Each resource has URI, name, description, and mimeType
- Description includes timestamp and rebellion status

**ReadResource Handler**:
- Parses `thought://` URIs
- Returns full thought as JSON
- Throws `InvalidParams` error if thought not found

**MIME Type**: `application/json`

## Development Workflows

### Initial Setup
```bash
npm install          # Installs dependencies and runs prepare script
                     # prepare script automatically runs build
```

### Building
```bash
npm run build        # Compile TypeScript and make executable
npm run prepare      # Same as build (runs automatically on install)
```

### Development Mode
```bash
npm run watch        # Auto-rebuild on file changes
```

### Debugging
```bash
npm run inspector    # Launch MCP Inspector for debugging
                     # Provides browser-based debugging interface
                     # Necessary because MCP uses stdio (not console.log)
```

### Installation for Claude Desktop

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "unconventional-thinking": {
      "command": "/absolute/path/to/unconventional-thinking/build/index.js"
    }
  }
}
```

## Key Conventions & Best Practices

### 1. Code Organization
- **Single File Architecture**: All logic in `src/index.ts` (327 lines)
- **No Subdirectories**: Simple flat structure for small codebase
- **Inline Helper Functions**: `generateUnreasonableThought()` and `generateBranchedThought()` at bottom

### 2. Error Handling
- Use `McpError` from SDK for all errors
- Common error codes:
  - `ErrorCode.InvalidParams` - Invalid thought ID or malformed request
  - `ErrorCode.MethodNotFound` - Unknown tool name
- Never throw generic `Error` objects

### 3. Context Efficiency Patterns
When modifying or extending this codebase:

**DO**:
- Return metadata + resource URIs from tools
- Filter data server-side before returning to Claude
- Use Resources API for large content
- Limit result sizes with `limit` parameters
- Store data persistently (not in memory)

**DON'T**:
- Return full thought content from tools
- Pass unfiltered datasets to Claude
- Load all thoughts into memory unnecessarily
- Return unlimited result sets

### 4. Persistent Storage
- **Location**: `.thoughts/thoughts.json`
- **Format**: JSON object with thought IDs as keys
- **Loading**: `loadThoughts()` - reads from file, returns empty object if missing
- **Saving**: `saveThoughts()` - writes with pretty-printing (2-space indent)
- **Directory Creation**: Automatic via `fs.mkdirSync` with `recursive: true`

### 5. TypeScript Conventions
- Use strict type checking (enabled in tsconfig.json)
- Interface definitions at top of file
- `any` types only for MCP request arguments (SDK limitation)
- Use optional chaining for optional fields (`thought.branchId?.`)

### 6. Versioning
- Current version: 0.2.0 (context-efficient refactor)
- Update version in **both** package.json and server initialization
- Version 0.2.0 marks the transition to context-efficient architecture

## Common Development Tasks

### Adding a New Tool

1. **Define tool schema** in `ListToolsRequestSchema` handler (src/index.ts:58-128)
2. **Add case** to `CallToolRequestSchema` handler (src/index.ts:167-291)
3. **Return metadata only**, not full content
4. **Include resource URI** for accessing full data
5. **Update README.md** with new tool documentation

Example pattern:
```typescript
case "my_new_tool": {
  const { param1, param2 } = request.params.arguments as any;

  // Do work...
  const result = doSomething(param1, param2);

  // Return metadata only
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        id: result.id,
        resourceUri: `resource://type/${result.id}`,
        metadata: "brief info only",
        message: "Use resource URI to access full content."
      }, null, 2)
    }]
  };
}
```

### Modifying the Thought Schema

1. **Update interface** (src/index.ts:16-24)
2. **Update tool returns** to include new metadata fields
3. **Update resource descriptions** in `ListResourcesRequestSchema`
4. **Migrate existing data** in `.thoughts/thoughts.json` if needed
5. **Update README.md** documentation

### Debugging Tips

- **Use MCP Inspector**: `npm run inspector` (essential for stdio-based debugging)
- **Check stderr**: Server logs go to stderr (stdout is for MCP protocol)
- **Validate JSON**: Ensure all tool returns are valid JSON
- **Test with small limits**: Use `limit=1` to test search functionality
- **Inspect .thoughts/**: Directly read `thoughts.json` to verify data

### Testing the Server

Since this is an MCP server, testing requires:
1. Build the server: `npm run build`
2. Launch MCP Inspector: `npm run inspector`
3. Open provided URL in browser
4. Test tools interactively through Inspector UI
5. Verify resource URIs can be read
6. Check `.thoughts/thoughts.json` for persistence

## Git Workflow

### Current Branch
- Main development branch: Follow git status or user specification
- Branch naming: Use descriptive names (e.g., `feature/new-tool`, `fix/search-bug`)

### Commit Conventions
- Use descriptive commit messages
- Reference issue numbers if applicable
- Format: "Type: Brief description"
  - Types: feat, fix, refactor, docs, chore

### Files to Never Commit
- `node_modules/` - Dependencies (managed by npm)
- `build/` - Compiled output (generated by tsc)
- `*.log` - Log files
- `.env*` - Environment files (though none currently used)

## Context-Efficiency Philosophy

This codebase is a **reference implementation** of Anthropic's context-efficiency patterns. When working with this code, always ask:

1. **Does this need to be in context?** - If not, use Resources API
2. **Can I filter server-side?** - Don't send unfiltered data to Claude
3. **Is metadata sufficient?** - Return metadata + URI, not full content
4. **Can I limit result size?** - Add `limit` parameters to prevent bloat

### Token Savings Example
With 100 thoughts (500 chars each):
- **Old pattern**: 50KB context usage (all content loaded)
- **New pattern**: ~3KB + fetch only what's needed (98.7% reduction)

## References & Resources

- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Model Context Protocol Docs](https://docs.anthropic.com/en/docs/mcp)
- [MCP SDK on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## Version History

- **v0.2.0** (Current) - Context-efficient refactor
  - Added Resources API for on-demand content loading
  - Implemented server-side filtering with `search_thoughts`
  - Changed tools to return metadata + URIs only
  - Persistent file-based storage

- **v0.1.x** (Legacy) - Initial implementation
  - Tools returned full thought content
  - No resource system
  - Context-inefficient design

## Common Pitfalls for AI Assistants

1. **Don't return full content from tools** - Use Resources API instead
2. **Don't load all thoughts unless necessary** - Use search with filters
3. **Don't forget to save** - Call `saveThoughts()` after modifications
4. **Don't use console.log** - Use stderr or MCP Inspector for debugging
5. **Don't break the executable** - Ensure shebang (`#!/usr/bin/env node`) stays at top
6. **Don't modify stdio transport** - It's required for MCP protocol
7. **Don't add dependencies lightly** - Keep it minimal (only MCP SDK currently)

## Questions & Support

- **Issues**: Report at repository issues page
- **MCP Protocol**: Consult official MCP documentation
- **TypeScript**: Check tsconfig.json for compiler settings
- **Debugging**: Always use MCP Inspector, not console.log

---

**Last Updated**: 2025-11-24
**Document Version**: 1.0
**Codebase Version**: 0.2.0
