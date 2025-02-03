# Unreasonable Thinking Server

A detailed tool for bold, unconventional, and boundary-breaking problem-solving.

This is a TypeScript-based MCP server that implements an unreasonable thinking system. It helps generate unconventional solutions to problems by:

- Generating unreasonable thoughts that challenge conventional wisdom
- Creating branches of thinking in different directions
- Tracking and organizing thoughts in a session

<a href="https://glama.ai/mcp/servers/pam1hp4gtk"><img width="380" height="200" src="https://glama.ai/mcp/servers/pam1hp4gtk/badge" alt="Unconventional-thinking server MCP server" /></a>

## Features

### Tools
- `generate_unreasonable_thought` - Generate new unconventional thoughts
  - Takes a problem description and optional parameters
  - Can build upon or rebel against previous thoughts
- `branch_thought` - Create new branches of thinking
  - Supports different directions: more extreme, opposite, tangential
  - Maintains connection to source thoughts
- `list_thoughts` - View all thoughts in the session
  - Can filter by branch
  - Shows relationships between thoughts

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
    "unreasonable-thinking-server": {
      "command": "/path/to/unreasonable-thinking-server/build/index.js"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
