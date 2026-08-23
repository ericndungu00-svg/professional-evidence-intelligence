import "dotenv/config";
import express from "express";
import type { Request } from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import path from "path";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";
import { serveStatic, setupVite } from "./vite";

// Guards the only endpoints reachable with zero authentication that either
// cost money per call (guest.startAnalyse triggers a real Gemini request)
// or are attractive to brute force (auth.login, auth.signup). tRPC batches
// multiple procedure calls into one comma-separated path segment
// (httpBatchLink), so this matches on procedure name rather than the exact
// path -- a request touching any of these procedures, batched or not,
// counts against the limit.
const RATE_LIMITED_PROCEDURES = ["guest.startAnalyse", "auth.login", "auth.signup"];

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

async function startServer() {
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
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
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
