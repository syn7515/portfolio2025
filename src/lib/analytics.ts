import { track } from '@vercel/analytics';

// Every custom event this site sends, named in one place. Vercel caps a project at 250 distinct
// event names and rejects anything beyond that for the rest of the billing period, so names are
// fixed strings and anything variable (which case study, which link) travels as a property. A
// template-built name like `open_${slug}` would spend that budget one page at a time.
//
// track() is a no-op outside a Vercel deployment — no network call in `next dev`, and nothing to
// guard at the call sites. Custom events need a Pro plan; on Hobby the page views below keep
// working and these are simply dropped.
//
// Properties stay low-cardinality (a slug, a host, a bucket) for the same reason the names do:
// Vercel gives the whole property payload 2KB and groups the dashboard by distinct value, so a URL
// with query params or a raw scroll offset produces a filter list nobody can read.

/** A case study opened from the home page's project list. */
export function trackCaseStudyOpen(slug: string) {
  track('case_study_open', { slug });
}

/** A link leaving the site: socials in the footer, personal projects in the list. */
export function trackOutboundClick(href: string, label: string) {
  let host = href;
  try {
    host = new URL(href).host;
  } catch {
    // A relative or malformed href is not outbound; keep the raw string rather than dropping the
    // event, so a miswired call site shows up in the dashboard instead of going silent.
  }
  track('outbound_click', { host, label });
}

/**
 * How far into a case study a reader actually got. Page views say a study was opened; this is the
 * only signal that says it was read, which is the thing worth knowing about a long page.
 */
export function trackCaseStudyDepth(slug: string, percent: DepthBucket) {
  track('case_study_depth', { slug, percent });
}

export type DepthBucket = 25 | 50 | 75 | 100;

export const DEPTH_BUCKETS: readonly DepthBucket[] = [25, 50, 75, 100];
