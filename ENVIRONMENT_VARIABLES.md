# Environment Variables

This file lists the configuration names used by the export. **It contains no secret values.** Supply values through your host's secret manager or a local untracked environment file.

| Variable | Required for current Manus implementation | Purpose | External-deployment note |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | Runtime mode, normally `development` or `production`. | Set according to the host environment. |
| `PORT` | Host-dependent | Node HTTP port. | Do not hard-code a port; most hosts inject this. |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string for Drizzle. | Use SSL/TLS options where your database requires them. |
| `JWT_SECRET` | Yes | Session cookie signing secret. | Generate a new strong random value for each deployment. |
| `VITE_APP_ID` | Yes for Manus OAuth | Manus application identifier. | Replace the Manus OAuth flow for a non-Manus deployment. |
| `OAUTH_SERVER_URL` | Yes for Manus OAuth | Manus OAuth API origin. | Replace with your identity provider's configuration where applicable. |
| `VITE_OAUTH_PORTAL_URL` | Yes for Manus OAuth | Browser-facing OAuth portal origin. | Replace with your identity provider's login origin. |
| `OWNER_OPEN_ID` | Optional | Identifies the initial owner/admin in the existing OAuth flow. | Define a corresponding administrator bootstrap approach externally. |
| `ANTHROPIC_API_KEY` | Yes | Server-side Anthropic API credential used by `server/_core/llm.ts`. | Store only in the server-side secret manager; never expose it to the frontend. |
| `BUILT_IN_FORGE_API_URL` | Yes for the remaining storage adapter | Server-side Manus Forge service origin. | No longer used by the LLM adapter (replaced by `ANTHROPIC_API_KEY`); still used by `server/storage.ts` until object storage is replaced. |
| `BUILT_IN_FORGE_API_KEY` | Yes for the remaining storage adapter | Server-side Manus Forge credential. | No longer used by the LLM adapter (replaced by `ANTHROPIC_API_KEY`); still used by `server/storage.ts` until object storage is replaced. |
| `VITE_FRONTEND_FORGE_API_URL` | Current Manus frontend integration | Browser-facing Forge service origin. | Remove or replace any dependent client integration outside Manus. |
| `VITE_FRONTEND_FORGE_API_KEY` | Current Manus frontend integration | Scoped frontend Forge token. | Do not substitute a server secret; use a public/scoped value only if required by a replacement integration. |

The project may also receive optional Manus analytics and display variables (`VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`, `VITE_APP_TITLE`, `VITE_APP_LOGO`, and `OWNER_NAME`). They are not required by the core code path described in the export.
