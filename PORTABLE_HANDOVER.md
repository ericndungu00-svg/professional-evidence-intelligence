# Professional Evidence Intelligence — Portable Source Handover

This export contains the complete application code for **Professional Evidence Intelligence**: the React frontend, Express/tRPC backend, Drizzle database schema, tests, package lockfile, build configuration, and deployment-facing configuration files. It intentionally excludes `node_modules`, local development logs, generated build output, local database credentials, OAuth cookies, API keys, and user-uploaded/private evidence content.

## Contents

| Path | Purpose |
| --- | --- |
| `client/` | React 19 frontend, pages, components, styles, and tRPC client setup. |
| `server/` | Express/tRPC server, evidence-analysis engine, document ingestion, persistence helpers, and tests. |
| `drizzle/schema.ts` | Authoritative MySQL/TiDB schema definition. |
| `drizzle/migrations/0000_portable_fresh_schema.sql` | Runnable fresh-schema MySQL DDL generated from the current Drizzle schema. |
| `drizzle/meta/` | Drizzle schema snapshots retained from the project. |
| `shared/` | Types and shared application constants. |
| `ENVIRONMENT_VARIABLES.md` | Environment-variable names and purposes only; it contains no secret values. |
| `package.json`, `pnpm-lock.yaml` | Runtime scripts and reproducible dependency lockfile. |
| `vite.config.ts`, `drizzle.config.ts`, `tsconfig.json`, `vitest.config.ts` | Build, database, TypeScript, and test configuration. |

## Local setup

Use Node.js 22 and pnpm 10 or later. Use `ENVIRONMENT_VARIABLES.md` to create a local environment file or configure your host's environment-variable settings with environment-specific values:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm dev
```

The application expects a MySQL/TiDB-compatible database. For a new database, apply the included fresh-schema DDL, then use Drizzle to generate and apply future incremental migrations.

```bash
mysql --defaults-extra-file=/path/to/secure-client.cnf < drizzle/migrations/0000_portable_fresh_schema.sql
pnpm build
pnpm start
```

The original working directory contained Drizzle schema snapshots but no historical generated SQL migration files. Therefore the export includes a new **fresh-schema DDL** file generated from `drizzle/schema.ts`; it is suitable for creating a new database, not for replaying unknown historical production migrations.

## External-deployment considerations

The current code is portable, but two Manus-hosted adapters require replacement or equivalent services outside Manus:

| Current integration | Code location | External replacement needed |
| --- | --- | --- |
| Manus OAuth | `server/_core/oauth.ts`, `server/_core/context.ts` | Configure compatible OAuth/session handling for your host and update the application redirect URL. |
| Server-side LLM proxy | `server/_core/llm.ts` | Replace `invokeLLM` with a provider client and keep the existing `InvokeParams`/`InvokeResult` contract. |
| Object storage via Forge/S3 presigning | `server/storage.ts` | Replace the Forge presign calls with S3, R2, GCS, Azure Blob Storage, or another protected object store. |
| Deployment runtime | `server/_core/index.ts`, `vite.config.ts` | Supply Node.js, environment variables, database SSL settings, and a public HTTPS origin. |

The `BUILT_IN_FORGE_*` and `VITE_FRONTEND_FORGE_*` names are retained in `ENVIRONMENT_VARIABLES.md` for completeness. They are Manus-specific and should not be treated as portable third-party credentials. No production secret value is included in this export.

## Validation status at handover

The project runs `pnpm check` for TypeScript validation and `pnpm test` for Vitest coverage. The latest local verification before this export passed **34 tests across 10 test files**. Tests cover source traceability, evidence discipline, Objective A/B/C separation, Objective B schema handling and fallbacks, and the client transport boundary.

> **Data boundary:** User evidence, document files, database records, production secrets, session cookies, and live storage objects are not part of this code export. They must be migrated independently and securely by the receiving deployment owner.

## GitHub handover

GitHub export can be initiated from the Manus project management interface under **Settings → GitHub**. This environment does not have the user’s GitHub integration enabled, so no repository has been created or pushed without the user’s explicit authentication and repository selection.
