/**
 * The width at which the paper lifts off the page as a floating sheet.
 *
 * Between here and PAPER_BREAKPOINT the sheet is the 1280px one slid left: no text sidebar (the
 * compact rail covers Home and the outline), and a left margin that shrinks linearly from 220px at
 * 1280 to 40px here (paperLeftAt below). Everything on the sheet keeps the inset it had at 1280;
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
 * Why 1280: --sidebar-w bottoms out at its 220px minimum everywhere below ~1287px, so the paper's
 * left edge would be pinned at 220px no matter how narrow the viewport got, while the text column
 * centres on the *viewport* (50vw - 280px) — the gap between the paper's edge and the text is
 * `vw / 2 - 500`, 140px here. Rather than let that gap close, the sidebar steps aside below this
 * width and the sheet band takes over, holding the column at its 1280px inset.
 *
 * CSS cannot read this value — media queries take no custom properties — so the same number is
 * repeated as `screens.paper` in tailwind.config.js (which is what the `paper:` variant compiles
 * to) and literally in the paper media query in globals.css and the rail's entrance in
 * blog-post-rail-nav.module.css. Those four places move together, along with the band's 1280px
 * values pinned in globals.css, page.tsx and blog-post-layout.tsx.
 */
export const PAPER_BREAKPOINT = 1280

/**
 * The widest the sheet gets (--paper-max-w in globals.css). It reaches this at ~1475px; past that
 * a right margin opens up, and from PAPER_CENTERED_BREAKPOINT the sheet sits centred with its
 * contents at a fixed inset.
 */
export const PAPER_MAX_WIDTH = 1200

/** Where the right margin catches up with the 280px left one and the sheet starts centring. */
export const PAPER_CENTERED_BREAKPOINT = PAPER_MAX_WIDTH + 2 * 280

/** Where --sidebar-w stops growing: globals.css clamps it to its 280px maximum from here up. */
export const SIDEBAR_SETTLED_BREAKPOINT = 1500

/**
 * JS mirror of --sidebar-w (globals.css). The paper's left edge sits here, so anything that centres
 * on the viewport — the carousel's cards — has to measure against it to stay on the sheet.
 */
export function sidebarWidthAt(viewportWidth: number): number {
  if (viewportWidth < PAPER_BREAKPOINT) return 0
  return Math.min(280, Math.max(220, 0.27273 * viewportWidth - 129.09))
}

/** JS mirror of --paper-left (globals.css): where the paper's left edge sits. */
export function paperLeftAt(viewportWidth: number): number {
  if (viewportWidth < SHEET_BREAKPOINT) return 0
  if (viewportWidth < PAPER_BREAKPOINT) {
    const t = (viewportWidth - SHEET_BREAKPOINT) / (PAPER_BREAKPOINT - SHEET_BREAKPOINT)
    return SHEET_MIN_LEFT + t * (sidebarWidthAt(PAPER_BREAKPOINT) - SHEET_MIN_LEFT)
  }
  return Math.max(sidebarWidthAt(viewportWidth), (viewportWidth - PAPER_MAX_WIDTH) / 2)
}

/** The paper's width: the viewport less its left margin, up to PAPER_MAX_WIDTH. */
export function paperWidthAt(viewportWidth: number): number {
  const width = viewportWidth - paperLeftAt(viewportWidth)
  return viewportWidth < PAPER_BREAKPOINT ? width : Math.min(width, PAPER_MAX_WIDTH)
}
