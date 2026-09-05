// Crawlable server-rendered HTML for the Civil Service Success Profiles
// guide pages (hub + one per behaviour) -- same reasoning and pattern as
// sharedResultHtml.ts for /results/:slug, but for content that's static
// and known upfront rather than looked up from the database. Content comes
// from shared/civilServiceBehaviours.ts, the same file the client-side
// pages (client/src/pages/guides/*) read, so the two can never disagree on
// what a guide says.

import { civilServiceBehaviourGuides, type CivilServiceBehaviourGuide } from "../../shared/civilServiceBehaviours";
import { escapeHtml, injectBody, replaceHead, truncate } from "./htmlShell";

export function renderBehaviourHubHtml(baseHtml: string, canonicalUrl: string): string {
  const title = "Civil Service Success Profiles: the 9 behaviours, explained | ProveMyCV";
  const description = "A plain-English guide to all nine Civil Service Success Profiles behaviours, with what assessors look for, common mistakes, and a worked STAR example for each.";
  const items = civilServiceBehaviourGuides
    .map(guide => `<li><a href="/guides/civil-service-success-profiles/${guide.slug}">${escapeHtml(guide.name)}</a> — ${escapeHtml(guide.standsFor)}</li>`)
    .join("");
  const bodyHtml = `<div id="ssr-fallback"><h1>${title}</h1><p>${description}</p><ul>${items}</ul></div>`;
  return injectBody(replaceHead(baseHtml, title, description, canonicalUrl), bodyHtml);
}

export function renderBehaviourGuideHtml(baseHtml: string, guide: CivilServiceBehaviourGuide, canonicalUrl: string): string {
  const title = escapeHtml(`${guide.name} example — Civil Service | ProveMyCV`);
  const description = escapeHtml(truncate(guide.metaDescription, 155));
  const assessorsLookFor = guide.assessorsLookFor.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  const commonMistakes = guide.commonMistakes.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  const star = guide.starGuidance.map(item => `<h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.guidance)}</p>`).join("");
  const bodyHtml = `<div id="ssr-fallback"><h1>${escapeHtml(guide.name)}</h1><p>${escapeHtml(guide.standsFor)}</p><h2>What this behaviour means</h2><p>${escapeHtml(guide.overview)}</p><h2>What assessors are looking for</h2><ul>${assessorsLookFor}</ul><h2>Common mistakes</h2><ul>${commonMistakes}</ul><h2>How to structure your STAR example</h2>${star}</div>`;
  return injectBody(replaceHead(baseHtml, title, description, canonicalUrl), bodyHtml);
}

export function renderBehaviourGuideNotFoundHtml(baseHtml: string, canonicalUrl: string): string {
  const title = "Behaviour guide not found | ProveMyCV";
  const description = "We don't have a guide for that Civil Service Success Profiles behaviour.";
  const bodyHtml = `<div id="ssr-fallback"><h1>${title}</h1><p>${description}</p></div>`;
  return injectBody(replaceHead(baseHtml, title, description, canonicalUrl), bodyHtml);
}
