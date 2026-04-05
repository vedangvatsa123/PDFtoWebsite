# @cvinbio/mcp-server

MCP server for searching professional profiles from the [CVin.Bio](https://cvin.bio) talent database.

## Tools

- **search_candidates** - Search by skills, location, job title, or keyword
- **get_profile** - Get a full profile by username

## Setup

### Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cvinbio": {
      "command": "npx",
      "args": ["@cvinbio/mcp-server"],
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_KEY": "your_service_role_key"
      }
    }
  }
}
```

## License

MIT
