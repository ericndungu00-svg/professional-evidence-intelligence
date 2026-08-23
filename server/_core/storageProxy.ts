import type { Express } from "express";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getUserForSessionToken } from "./auth";
import { getDocumentByStorageKey } from "../db";
import { storageGetSignedUrl } from "../storage";

// A storage key (evidence/{userId}/{timestamp}_{filename}) is not a secret
// -- user IDs are small sequential integers -- so this route must prove the
// requesting session actually owns the document at that key before handing
// out a signed URL, the same way every other document-scoped route does.
export function registerStorageProxy(app: Express) {
  app.get("/storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const user = await getUserForSessionToken(cookies[COOKIE_NAME]);
    if (!user) {
      res.status(401).send("Sign in to access this file.");
      return;
    }

    const owned = await getDocumentByStorageKey(user.id, key);
    if (!owned) {
      res.status(404).send("File not found.");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.redirect(307, url);
    } catch (error) {
      console.error("[StorageProxy] error:", error);
      res.status(502).send("Storage backend error");
    }
  });
}
