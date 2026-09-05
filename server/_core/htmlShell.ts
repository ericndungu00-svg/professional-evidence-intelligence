// Small shared primitives for augmenting the site's one base HTML shell
// with real, per-page <title>/meta description/Open Graph tags and a
// visible content summary -- used by every crawlable server-rendered route
// (server/_core/sharedResultHtml.ts for /results/:slug,
// server/_core/guideHtml.ts for the Civil Service behaviour guide pages).
// Kept as one small module rather than duplicated per route so the
// escaping logic in particular -- the one place untrusted/guest-supplied
// text can land directly in server-rendered markup -- only exists once.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

export function replaceHead(html: string, title: string, description: string, canonicalUrl: string): string {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`);
  const ogTags = `<meta property="og:type" content="website" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${canonicalUrl}" /></head>`;
  out = out.replace(/<\/head>/, ogTags);
  return out;
}

export function injectBody(html: string, bodyHtml: string): string {
  return html.replace(/<body>/, `<body>${bodyHtml}`);
}
