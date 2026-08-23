import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  // Frontend and API are served from the same Express process and origin
  // (see server/_core/index.ts) -- this app is never embedded cross-origin
  // any more (the Manus-preview-iframe code that once needed SameSite=None
  // is gone), so Lax is correct in every case, not just plain-HTTP local
  // development. SameSite=None would additionally require Secure on every
  // cookie (RFC 6265bis) and weakens CSRF protection for no remaining
  // benefit, so it's no longer used at all here. Secure itself still needs
  // to track the request's real protocol: forcing it unconditionally would
  // mean a real browser over plain http://localhost never stores the
  // session cookie at all (even though curl, which doesn't enforce this
  // policy, would appear to work fine and mask the bug).
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
  };
}
