# Environment Variables

This file lists the configuration names used by the export. **It contains no secret values.** Supply values through your host's secret manager or a local untracked environment file.

| Variable | Required for current Manus implementation | Purpose | External-deployment note |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | Runtime mode, normally `development` or `production`. | Set according to the host environment. |
| `PORT` | Host-dependent | Node HTTP port. | Do not hard-code a port; most hosts inject this. |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string for Drizzle. | Use SSL/TLS options where your database requires them. |
| `SESSION_SECRET` | Yes | Server-side pepper mixed into the session-token hash (`server/_core/auth.ts`) — not a signing key, since sessions are looked up server-side, not verified statelessly. | Generate a new strong random value (e.g. `openssl rand -hex 32`) for each deployment; changing it invalidates all existing sessions. |
| `OWNER_EMAIL` | Optional | The email address (lowercased) that should be granted the `admin` role automatically on signup. | Set to your own email before you sign up for the first time if you want an admin account; leave unset otherwise. |
| `GEMINI_API_KEY` | Yes | Server-side Google Gemini API credential (from Google AI Studio) used by `server/_core/llm.ts`. | Store only in the server-side secret manager; never expose it to the frontend. |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID — used to build the R2 S3-compatible endpoint (`https://<account_id>.r2.cloudflarestorage.com`) in `server/storage.ts`. | Found on the Cloudflare dashboard's R2 overview page. |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key ID (S3-compatible credential, created under R2 → Manage API Tokens). | Store only in the server-side secret manager; never expose it to the frontend. Scope the token to the one bucket below if possible. |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret access key, paired with `R2_ACCESS_KEY_ID`. | Store only in the server-side secret manager; never expose it to the frontend. |
| `R2_BUCKET_NAME` | Yes | Name of the R2 bucket evidence files are uploaded to. | Create the bucket in the Cloudflare dashboard before first use; the app does not create it automatically. |
| `S3_ENDPOINT_OVERRIDE` | Optional, local testing only | Overrides the R2 endpoint with an arbitrary S3-compatible endpoint (e.g. a local MinIO instance). | Never set in production — its only purpose is testing `server/storage.ts` against a non-R2 S3-compatible server. |
| `BUILT_IN_FORGE_API_URL` | Not required by this product | No longer used by the LLM or storage adapters. Still read by a handful of unused Manus-template system-router utilities (`server/_core/imageGeneration.ts`, `voiceTranscription.ts`, `notification.ts`, `map.ts`, `heartbeat.ts`, `dataApi.ts`) that this app's UI never calls. | Safe to leave unset — those utilities simply aren't reachable from the product. Remove the files if you want them gone entirely. |
| `BUILT_IN_FORGE_API_KEY` | Not required by this product | Same as above. | Same as above. |
| `VITE_FRONTEND_FORGE_API_URL` | No longer used | Was the browser-facing Forge service origin. | Not referenced by any current client code. |
| `VITE_FRONTEND_FORGE_API_KEY` | No longer used | Was the scoped frontend Forge token. | Not referenced by any current client code. |

The project may also receive optional Manus analytics and display variables (`VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`, `VITE_APP_TITLE`, `VITE_APP_LOGO`, and `OWNER_NAME`). They are not required by the core code path described in the export.
