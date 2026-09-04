// Produces the HTML for the crawlable /results/:slug route (see
// server/_core/index.ts) by augmenting the same base HTML shell dev/prod
// already serve for every other page -- a dynamic <title>/meta description/
// Open Graph block plus a real, semantic, visible content summary inserted
// right after <body>, so a crawler or a social-card scraper that never runs
// JS still sees genuine per-page content (same "real content before JS
// runs" goal as the earlier PeerPush hidden-link fix in client/index.html,
// but with actual per-page dynamic content this time instead of one static
// link). The React app still boots normally on top of this and removes the
// pre-rendered block once it mounts (see the ssr-fallback id, cleaned up in
// client/src/main.tsx).
//
// resultData is guest-supplied free text (pasted CV/job-description
// content) reaching a *public, unauthenticated* page -- every value pulled
// from it is HTML-escaped before being written into this string. Never
// interpolate resultData fields into the returned HTML without going
// through escapeHtml first.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

// Mirrors canonicalAssessment/formatStatus in client/src/components/
// EvidenceMap.tsx -- kept as its own small copy here rather than shared
// across the client/server boundary, same as this codebase's existing
// client-side duplication of the same mapping (Home.tsx historically,
// ObjectiveReports.tsx today).
function formatAssessmentStatus(value: string): string {
  const canonical = ({ demonstrated: "directly_evidenced", partial: "indirectly_relevantly_evidenced", unsupported: "contradicted" } as Record<string, string>)[value] ?? value;
  return canonical.replace(/_/g, " ");
}

function replaceHead(html: string, title: string, description: string, canonicalUrl: string): string {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`);
  const ogTags = `<meta property="og:type" content="website" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${canonicalUrl}" /></head>`;
  out = out.replace(/<\/head>/, ogTags);
  return out;
}

function injectBody(html: string, bodyHtml: string): string {
  return html.replace(/<body>/, `<body>${bodyHtml}`);
}

export function renderSharedResultFoundHtml(baseHtml: string, resultData: Record<string, any>, canonicalUrl: string): string {
  const profile = resultData.profile ?? {};
  const currentRole = typeof profile.currentRole === "string" && profile.currentRole ? profile.currentRole : "A shared evidence review";
  const targetRole = typeof profile.targetRole === "string" ? profile.targetRole : "";
  const summary = typeof resultData.summary === "string" ? resultData.summary : "";
  const requirements: any[] = Array.isArray(resultData.requirements) ? resultData.requirements : [];
  const assessments: any[] = Array.isArray(resultData.assessments) ? resultData.assessments : [];
  const assessmentByRequirement = new Map(assessments.map((item: any) => [item.requirementId, item]));

  const title = escapeHtml(truncate(targetRole ? `${currentRole} — checked against ${targetRole} | ProveMyCV` : `${currentRole} | ProveMyCV`, 70));
  const description = escapeHtml(truncate(summary || "See how this evidence stacks up against the target role, requirement by requirement.", 155));

  const items = requirements.map(requirement => {
    const assessment = assessmentByRequirement.get(requirement.id);
    const status = formatAssessmentStatus(assessment?.assessment ?? "not_found");
    return `<li><strong>${escapeHtml(String(requirement.criterion ?? ""))}</strong> — ${escapeHtml(status)}</li>`;
  }).join("");

  const bodyHtml = `<div id="ssr-fallback"><h1>${escapeHtml(currentRole)}</h1>${targetRole ? `<p>Aiming for: ${escapeHtml(targetRole)}</p>` : ""}<p>${escapeHtml(summary)}</p>${items ? `<ul>${items}</ul>` : ""}</div>`;

  return injectBody(replaceHead(baseHtml, title, description, canonicalUrl), bodyHtml);
}

export function renderSharedResultNotFoundHtml(baseHtml: string, canonicalUrl: string): string {
  const title = "Shared result not found | ProveMyCV";
  const description = "This shared result was not found. The link may be mistyped, or it may no longer be available.";
  const bodyHtml = `<div id="ssr-fallback"><h1>${title}</h1><p>${description}</p></div>`;
  return injectBody(replaceHead(baseHtml, title, description, canonicalUrl), bodyHtml);
}
