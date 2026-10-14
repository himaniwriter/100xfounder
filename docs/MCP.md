# 100xFounder MCP server

The site is an MCP server at `https://100xfounder.com/wp-json/xf-claude/v1/mcp` (through the Claude Connector plugin), so Claude (Claude Code or Claude Desktop) can work with the site directly, on your Claude plan, with no API credits.

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

## Connect it (once) — the private Claude connector

The site's MCP runs through a separate plugin, **100xFounder Claude Connector** (`wordpress/xf-claude-connector/`, release zip `wordpress/dist/xf-claude-connector.zip`). It gives one Claude account its own door into the site and closes every other way in.

1. **Install:** WordPress → Plugins → Add New → Upload → `xf-claude-connector.zip` → Activate. (The old `/xf/v1/mcp` endpoint switches off automatically.)
2. **Create the Claude user:** Users → Add New, username `claude`, role **Author** (Editor only if you want Claude to publish). No password needed; it never logs in.
3. **Set it up:** Settings → **Claude connector**:
   - *Acts as WordPress user* → `claude`, then **Save**.
   - Tick the tool groups you want (Read, Write drafts, Add images are on; Publish and Run routines are off by default).
   - **Create token** (90 days by default). Copy it: it's shown once.
4. **Give it to Claude, not to the repo or chat:** add `XF_MCP_TOKEN` = the token to the Claude Code cloud environment (environment menu → Edit → environment variables), or `export XF_MCP_TOKEN=…` on your computer. The repo's `.mcp.json` sends it as `Authorization: Bearer ${XF_MCP_TOKEN}`. Start a new session and check `/mcp`.

### What keeps it locked down
- One 256-bit token, stored only as an HMAC (a database leak doesn't reveal it), expiring, revocable, rotatable (the old token dies instantly).
- The token logs nobody into WordPress: it works only on `/wp-json/xf-claude/v1/mcp`, as the one user you chose, for one request at a time. WordPress passwords, cookies and application passwords don't work on it.
- Only the tool groups you tick, and the `claude` user's role still applies.
- HTTPS only; cross-site browser requests refused; 1 MB request cap; 120 calls/minute; 10 bad tokens lock that address out for an hour.
- Kill switch, optional IP allowlist, and an activity log of every call (Settings → Claude connector).

## Notes

- The server speaks MCP's Streamable HTTP transport (JSON responses, no streaming needed), protocol `2025-06-18`.
- Each call runs as the `claude` WordPress user, so WordPress roles decide what it may do.
- Admin-only tools (`run_routine`, `submit_all_for_indexing`) need an Administrator account's application password.
- The older REST endpoints (`xf/v1/queue`, `xf/v1/drafts`, …) used by `.claude/skills/*/xf.sh` still work.
