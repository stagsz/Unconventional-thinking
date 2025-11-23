# Unconventional Thinking Server (v0.2.0)

A context-efficient MCP server for bold, unconventional, and boundary-breaking problem-solving.

This is a TypeScript-based MCP server that implements an unconventional thinking system optimized for **context space savings** based on Anthropic's latest MCP architecture patterns. It generates and tracks creative solutions to problems while maintaining efficiency.

## Architecture: Context-Saving Design

This server demonstrates Anthropic's **recommended patterns for reducing context overhead by 98.7%**:

### Key Context-Saving Features

1. **Resources API for On-Demand Data Loading**
   - Thought content is stored as resources (`thought://id`)
   - Claude loads full content only when explicitly needed
   - Metadata is returned by default, saving tokens

2. **Server-Side Filtering**
   - `search_thoughts` filters data locally instead of passing unfiltered sets to Claude
   - Only matching results returned, not entire dataset
   - Reduces context consumption by filtering at the source

3. **Metadata-First Returns**
   - Tools return only essential metadata + resource URIs
   - Full thought content accessible via Resources API
   - Claude decides whether to fetch full content based on need

4. **Persistent File-Based Storage**
   - Data persists in `.thoughts/` directory
   - No in-memory bloat accumulating across sessions
   - Easy to inspect and debug thoughts locally

## Features

### Tools (All Context-Efficient)
- `generate_unreasonable_thought` - Generate new unconventional thoughts
  - Returns metadata + resource URI, not full content
  - Can build upon or rebel against previous thoughts
  - Full thought content available via Resources API

- `branch_thought` - Create new branches of thinking
  - Supports directions: more extreme, opposite, tangential
  - Returns only branch metadata for efficiency

- `search_thoughts` - **NEW: Efficient metadata search**
  - Filters by branchId, isRebellion, challengesAssumption
  - Returns only matching IDs and metadata
  - Includes limit parameter to control result size
  - Demonstrates server-side filtering pattern

### Resources (On-Demand Content Loading)
- Each thought available as a resource: `thought://[thoughtId]`
- Metadata includes: isRebellion, challengesAssumption, timestamp, branch info
- Full thought content loaded only when Claude explicitly requests it
- Dramatically reduces token usage when many thoughts exist

## How This Implements Context Efficiency

### 1. Progressive Disclosure
Claude doesn't need the full content of 100 thoughts upfront. Instead:
- `search_thoughts` returns just IDs and metadata (100 bytes per thought)
- Claude selectively fetches full content via Resources API for relevant thoughts
- Similar to how filesystems work: list files, then open specific files

### 2. Server-Side Filtering
Traditional approach (❌ inefficient):
```
All 1000 thoughts → Claude → Claude filters → Uses only 10
(costs tokens for all 1000)
```

This server (✅ efficient):
```
search_thoughts filter params → Server filters locally → Returns only 10 results
(Claude never sees the unused 990)
```

### 3. Metadata-First Pattern
Tool responses contain:
- Thought ID
- Resource URI to access full content
- Brief metadata (2-3 KB each)
- NOT the full 500-character thought (saves ~5KB per thought)

**Example savings**: With 100 thoughts:
- Old way: 500KB context usage
- New way: ~30KB + fetch only what's needed

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "unconventional-thinking": {
      "command": "/path/to/unconventional-thinking/build/index.js"
    }
  }
}
```

## Usage Example

```
Claude: Generate an unreasonable thought about scaling problems
→ Tool: generate_unreasonable_thought("scaling problems")
← Returns: thoughtId, resourceUri, metadata

Claude: What are all the rebellious thoughts?
→ Tool: search_thoughts(isRebellion=true, limit=5)
← Returns: 5 matching thought IDs with URIs (minimal context)

Claude: I need to see the full content of thought_xyz
→ Resource: Read thought://thought_xyz
← Returns: Full thought content (loaded only when needed)
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## References

This server implements patterns from:
- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Model Context Protocol Docs](https://docs.anthropic.com/en/docs/mcp)
