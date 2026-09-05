// Generated from the same content list the guide pages themselves read
// (shared/civilServiceBehaviours.ts) rather than hand-maintained as a
// static file, so adding or renaming a behaviour guide can never leave the
// sitemap out of sync with what actually exists. Covers only the small set
// of fixed, known-upfront static pages -- the dynamically-created
// /results/:slug pages are deliberately left out (see the note on
// server/_core/sharedResultHtml.ts's original branch: generating a sitemap
// for user-triggered share URLs is a reasonable follow-up, not required
// for those pages to be indexed -- their own per-page meta tags are enough
// for a crawler that lands on a linked page).

import { civilServiceBehaviourGuides } from "../../shared/civilServiceBehaviours";

const STATIC_PATHS = ["/", "/guides/civil-service-success-profiles", "/privacy", "/terms", "/contact"];

export function renderSitemapXml(origin: string): string {
  const paths = [...STATIC_PATHS, ...civilServiceBehaviourGuides.map(guide => `/guides/civil-service-success-profiles/${guide.slug}`)];
  const urls = paths.map(path => `<url><loc>${origin}${path}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
