/**
 * The width at which the paper lifts off the page as a floating sheet.
 *
 * Between here and PAPER_BREAKPOINT the sheet is the 1200px one slid left: no text sidebar (the
 * compact rail covers Home and the outline), and a left margin that shrinks linearly from 220px at
 * 1200 to 40px here (paperLeftAt below). Everything on the sheet keeps the inset it had at 1200;
 * only the empty right side of the sheet gives up width. The margin is what runs out: much below
 * this it could no longer read as one.
 *
 * Repeated as `screens.sheet` in tailwind.config.js and in the sheet and grid media queries in
 * globals.css.
 */
export const SHEET_BREAKPOINT = 1024

/** The paper's left margin at SHEET_BREAKPOINT, where the sheet band bottoms out. */
const SHEET_MIN_LEFT = 40

/**
 * The width at which the text sidebar appears and the sheet shifts right to make room for it.
 *
 * Below it --sidebar-w collapses to 0, the paper loses its shadow and runs edge to edge, and the
 * text sidebar gives way to the compact rail. Above it the sidebar appears, the paper is inset by
 * --sidebar-w and dropped 100px from the top, and the drafting grid shows in the margin it leaves.
 *
 * Why 1200: --sidebar-w bottoms out at its 220px minimum everywhere below ~1280px, so the paper's
 * left edge would be pinned at 220px no matter how narrow the viewport got, while the text column
 * centres on the *viewport* (50vw - 280px) — the gap between the paper's edge and the text is
 * `vw / 2 - 500`, 100px here. Rather than let that gap close, the sidebar steps aside below this
 * width and the sheet band takes over, holding the column at its 1200px inset. (It was 1280 while
 * the sheet maxed out at 1200px; it came down with the sheet's 1120px maximum.)
 *
 * CSS cannot read this value — media queries take no custom properties — so the same number is
 * repeated as `screens.paper` in tailwind.config.js (which is what the `paper:` variant compiles
 * to) and literally in the paper media query in globals.css and the rail's entrance in
 * blog-post-rail-nav.module.css. Those four places move together, along with the band's 1200px
 * values pinned in globals.css, page.tsx and blog-post-layout.tsx.
 */
export const PAPER_BREAKPOINT = 1200

/**
 * The widest the sheet gets (--paper-max-w in globals.css). The sheet held against the sidebar
 * reaches this at PAPER_CENTERED_BREAKPOINT; the centred one comes in narrower there and grows back
 * to it by SIDEBAR_RETURN_BREAKPOINT (paperMaxWidthAt below).
 */
export const PAPER_MAX_WIDTH = 1120

/**
 * Where the sheet reaches PAPER_MAX_WIDTH and a right margin would open — the width at which
 * `vw - sidebarWidthAt(vw)` comes to 1120 (8/11 vw + 129.09px = 1120px). From here the sheet
 * centres on the viewport instead of leaving all the extra width on its right.
 *
 * Centring here is a step, not a ramp: the right margin starts from 0 while the left one is ~243px.
 * The sheet also narrows to ~1041px as it crosses (paperMaxWidthAt), so its left edge moves ~82px
 * left. Nothing continuous could centre it that early.
 *
 * Repeated literally in the centred media query in globals.css, the sidebar in
 * blog-post-layout.tsx and the rail in blog-post-rail-nav.tsx and its module CSS.
 */
export const PAPER_CENTERED_BREAKPOINT = 1362.5

/**
 * Where the centred sheet's left margin is back up to the text sidebar's 220px minimum, and where
 * the sheet is back to PAPER_MAX_WIDTH. Below it, from PAPER_CENTERED_BREAKPOINT, the margin
 * (161–220px) can't hold the sidebar's labels, so posts show the compact rail in its place, as they
 * do across the sheet band. Repeated with PAPER_CENTERED_BREAKPOINT.
 */
export const SIDEBAR_RETURN_BREAKPOINT = PAPER_MAX_WIDTH + 2 * 220

/**
 * JS mirror of --paper-max-w (globals.css). PAPER_MAX_WIDTH until the sheet centres; from there a
 * ramp from ~1041px at PAPER_CENTERED_BREAKPOINT to PAPER_MAX_WIDTH at SIDEBAR_RETURN_BREAKPOINT,
 * so the centred sheet's margins open up rather than starting at ~121px against the padding inside.
 */
export function paperMaxWidthAt(viewportWidth: number): number {
  if (viewportWidth < PAPER_CENTERED_BREAKPOINT) return PAPER_MAX_WIDTH
  return Math.min(PAPER_MAX_WIDTH, Math.max(1040, 0.4 * viewportWidth + 496))
}

/** Where --sidebar-w stops growing: globals.css clamps it to its 280px maximum from here up. */
export const SIDEBAR_SETTLED_BREAKPOINT = 1500

/**
 * JS mirror of --sidebar-w (globals.css). The paper's left edge sits here until the sheet centres,
 * so anything that centres on the viewport — the carousel's cards — has to measure against it to
 * stay on the sheet. Once the sheet is centred the strip is no wider than the margin it sits in.
 */
export function sidebarWidthAt(viewportWidth: number): number {
  if (viewportWidth < PAPER_BREAKPOINT) return 0
  const width = Math.min(280, Math.max(220, 0.27273 * viewportWidth - 129.09))
  if (viewportWidth < PAPER_CENTERED_BREAKPOINT) return width
  return Math.min(width, (viewportWidth - paperMaxWidthAt(viewportWidth)) / 2)
}

/** JS mirror of --paper-left (globals.css): where the paper's left edge sits. */
export function paperLeftAt(viewportWidth: number): number {
  if (viewportWidth < SHEET_BREAKPOINT) return 0
  if (viewportWidth < PAPER_BREAKPOINT) {
    const t = (viewportWidth - SHEET_BREAKPOINT) / (PAPER_BREAKPOINT - SHEET_BREAKPOINT)
    return SHEET_MIN_LEFT + t * (sidebarWidthAt(PAPER_BREAKPOINT) - SHEET_MIN_LEFT)
  }
  if (viewportWidth < PAPER_CENTERED_BREAKPOINT) return sidebarWidthAt(viewportWidth)
  return (viewportWidth - paperMaxWidthAt(viewportWidth)) / 2
}

/** The paper's width: the viewport less its left margin, up to paperMaxWidthAt. */
export function paperWidthAt(viewportWidth: number): number {
  const width = viewportWidth - paperLeftAt(viewportWidth)
  return viewportWidth < PAPER_BREAKPOINT ? width : Math.min(width, paperMaxWidthAt(viewportWidth))
}
