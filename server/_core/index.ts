import "dotenv/config";
import express from "express";
import type { Request } from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import fs from "fs";
import net from "net";
import path from "path";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb, getSharedResultBySlug } from "../db";
import { renderSharedResultFoundHtml, renderSharedResultNotFoundHtml } from "./sharedResultHtml";
import { getDistIndexHtmlPath, renderDevIndexHtml, serveStatic, setupVite } from "./vite";
import { ENV } from "./env";
import type { ViteDevServer } from "vite";

// Guards every endpoint that either costs money per call (guest.startAnalyse
// and evidence.runAnalysis both trigger a real Gemini request) or is
// attractive to brute force (auth.login, auth.signup) -- evidence.runAnalysis
// requires a signed-in session, but that alone doesn't cap how many Gemini
// calls one account can trigger, so it's rate-limited the same as the
// zero-auth procedures below. tRPC batches multiple procedure calls into one
// comma-separated path segment (httpBatchLink), so this matches on procedure
// name rather than the exact path -- a request touching any of these
// procedures, batched or not, counts against the limit.
const RATE_LIMITED_PROCEDURES = ["guest.startAnalyse", "evidence.runAnalysis", "auth.login", "auth.signup", "auth.requestPasswordReset", "auth.resetPassword", "auth.resendVerificationEmail", "auth.verifyEmail", "contact.send"];

function requestTouchesLimitedProcedure(req: Request): boolean {
  const procedurePath = req.path.slice(1); // strip the leading "/" left after the /api/trpc mount
  const calledProcedures = procedurePath.split(",");
  return calledProcedures.some(procedure => RATE_LIMITED_PROCEDURES.includes(procedure));
}

const sensitiveProcedureLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." },
});

function rateLimitSensitiveProcedures(req: Parameters<typeof sensitiveProcedureLimiter>[0], res: Parameters<typeof sensitiveProcedureLimiter>[1], next: Parameters<typeof sensitiveProcedureLimiter>[2]) {
  if (requestTouchesLimitedProcedure(req)) {
    sensitiveProcedureLimiter(req, res, next);
    return;
  }
  next();
}

async function runPendingMigrations() {
  const db = await getDb();
  if (!db) {
    console.warn("[Migrate] DATABASE_URL not set — skipping migrations.");
    return;
  }
  const migrationsFolder =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "drizzle")
      : path.resolve(import.meta.dirname, "..", "drizzle");
  console.log("[Migrate] Applying pending database migrations...");
  await migrate(db, { migrationsFolder });
  console.log("[Migrate] Database schema is up to date.");
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// SESSION_SECRET is the pepper mixed into every session/reset-token hash
// (see server/_core/auth.ts) -- ENV falls back to "" when it's unset so a
// missing variable doesn't crash every other module that imports ENV, but
// actually starting the server on that fallback would mean every session
// hash is computed with a well-known, empty pepper. Checked once here,
// right before the server accepts any traffic, rather than in env.ts
// itself, so a misconfigured deploy fails loudly at startup instead of
// silently serving predictable session tokens.
function assertRequiredEnv() {
  if (!ENV.sessionSecret) {
    throw new Error("SESSION_SECRET is not set. Refusing to start: sessions and password-reset tokens would be hashed with a predictable, empty pepper. Set SESSION_SECRET (e.g. `openssl rand -hex 32`) and restart.");
  }
}

// A warning, not a startup failure: Resend's sandbox address only reliably
// delivers to the Resend account owner's own verified email, not real
// users, but nothing here can fix that automatically -- it takes verifying
// a sending domain in the Resend dashboard and adding the DNS records it
// asks for. Surfacing it loudly in the deploy logs (rather than leaving it
// as a page anyone would have to already know to check) is the most this
// code can do; refusing to boot over it would be a worse failure mode for
// a low-traffic launch than a same-day-noticed spam-folder problem.
function warnAboutRiskyEnvDefaults() {
  if (ENV.isProduction && ENV.resendFromEmail === "onboarding@resend.dev") {
    console.warn("[Startup] RESEND_FROM_EMAIL is still Resend's sandbox address (onboarding@resend.dev) -- password-reset emails will not reliably reach real users' inboxes. Verify a sending domain in the Resend dashboard, add its DNS records, and set RESEND_FROM_EMAIL to an address on that domain.");
  }
}

async function startServer() {
  assertRequiredEnv();
  warnAboutRiskyEnvDefaults();
  await runPendingMigrations();

  const app = express();
  const server = createServer(app);
  // Railway (and most PaaS hosts) put the app behind a single reverse
  // proxy, so req.ip is the proxy's own address unless this is set --
  // without it, every request looks like it comes from one IP and the
  // rate limiter below either blocks everyone together or (with
  // express-rate-limit's default validation) refuses to trust
  // X-Forwarded-For at all. "1" trusts exactly one hop, matching that
  // topology.
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  // tRPC API
  app.use(
    "/api/trpc",
    rateLimitSensitiveProcedures,
    createExpressMiddleware({
      router: appRouter,
      createContext,
      // The errorFormatter in ./trpc.ts strips the stack trace from what
      // reaches the client -- log the full error here instead, so a real
      // failure is still debuggable from the server logs.
      onError({ error, path }) {
        console.error(`[tRPC] ${path ?? "<unknown path>"}:`, error);
      },
    })
  );

  // Set once setupVite resolves below, in dev only -- the route handler
  // closes over this rather than requiring it at registration time, since
  // Express only calls the handler per-request (by which point setupVite
  // has already run).
  let viteDevServer: ViteDevServer | undefined;

  // Registered before the dev/prod SPA-fallback branch below so it's
  // matched first in both modes. Unlike every other page on this site
  // (100% client-rendered -- the server otherwise sends an empty #root and
  // everything else only exists once React mounts), this route serves
  // genuinely server-rendered HTML: a real per-result <title>/meta
  // description/OG tags and a visible content summary, so a crawler or a
  // social-card scraper that never runs JS still sees real content for a
  // shared guest result. See server/_core/sharedResultHtml.ts for why.
  app.get("/results/:slug", async (req, res, next) => {
    try {
      const canonicalUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const baseHtml = process.env.NODE_ENV === "development"
        ? await renderDevIndexHtml(viteDevServer!, req.originalUrl)
        : await fs.promises.readFile(getDistIndexHtmlPath(), "utf-8");
      const row = await getSharedResultBySlug(req.params.slug);
      if (!row) {
        res.status(404).set({ "Content-Type": "text/html" }).end(renderSharedResultNotFoundHtml(baseHtml, canonicalUrl));
        return;
      }
      res.status(200).set({ "Content-Type": "text/html" }).end(renderSharedResultFoundHtml(baseHtml, row.resultData, canonicalUrl));
    } catch (e) {
      next(e);
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    viteDevServer = await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
