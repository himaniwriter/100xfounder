# 100xFounder MCP server

The plugin turns the site into an MCP server at `https://100xfounder.com/wp-json/xf/v1/mcp`, so Claude (Claude Code or Claude Desktop) can work with the site directly, on your Claude plan, with no API credits.

## What Claude can do through it

| Tool | What it does |
|---|---|
| `site_overview` | Post counts by status, queue size, jobs, last daily run |
| `list_queue`, `add_to_queue`, `skip_queue_item` | Work the content queue |
| `list_categories`, `recent_posts`, `search_content`, `get_post` | Read what's on the site (to avoid duplicates) |
| `create_draft`, `update_draft` | Write news, funding rounds, events and how-to-apply guides. **Always lands as Pending review.** Refuses drafts under 150 words or without sources. |
| `set_featured_image` | Add a credited image you have the rights to |
| `review_checklist` | Shows what's still missing before you publish |
| `list_launches`, `list_jobs`, `list_companies` | Product Hunt launches, open roles, companies we sync |
| `run_routine` (admins) | Run import, jobs, indexing, events, contacts or digest now |
| `submit_all_for_indexing` (admins) | Send every public URL to IndexNow, and job pages to Google's Indexing API |
| `publish_post` | **Only exists if you turn on** Settings → Claude (MCP) → *Allow publishing through MCP*. Claude may call it only after you approve that specific post in chat. Refuses posts without sources. |

Nothing can be published without you, unless you turn that setting on.

## Connect it (once)

1. **Create the Claude user.** In WordPress: **Users → Add New**, username `claude`, role **Author** (or **Editor** if you want the publish tool to work). Untick "Send the new user an email".
2. **Create an application password.** Open that user's profile → **Application Passwords** → name it `Claude MCP` → **Add New Application Password**. Copy the password it shows (it's shown once). You can revoke it there any time.
3. **Store it on your computer, not in the repo.** In a terminal:
   ```bash
   export XF_MCP_AUTH=$(printf 'claude:%s' 'PASTE-THE-APP-PASSWORD' | base64)
   ```
   Put that line in your `~/.zshrc` or `~/.bashrc` so it survives restarts.
4. **Claude Code:** the repo's `.mcp.json` already points at the server and reads `XF_MCP_AUTH`. Open Claude Code in this folder and approve the `100xfounder` server when asked (`/mcp` shows its status).
   **Claude Desktop:** Settings → Connectors → Add custom connector is OAuth-only, so use Claude Code, or add it to `claude_desktop_config.json` through `npx mcp-remote https://100xfounder.com/wp-json/xf/v1/mcp --header "Authorization: Basic <the base64 value>"`.

## Notes

- The server speaks MCP's Streamable HTTP transport (JSON responses, no streaming needed), protocol `2025-06-18`.
- Each call runs as the `claude` WordPress user, so WordPress roles decide what it may do.
- Admin-only tools (`run_routine`, `submit_all_for_indexing`) need an Administrator account's application password.
- The older REST endpoints (`xf/v1/queue`, `xf/v1/drafts`, …) used by `.claude/skills/*/xf.sh` still work.
