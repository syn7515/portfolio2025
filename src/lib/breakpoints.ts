/**
 * The width at which the paper becomes a floating sheet.
 *
 * Below it --sidebar-w collapses to 0, the paper loses its shadow and runs edge to edge, and the
 * text sidebar gives way to the compact rail. Above it the sidebar appears, the paper is inset by
 * --sidebar-w and dropped 100px from the top, and the drafting grid shows in the margin it leaves.
 *
 * Why 1200: --sidebar-w bottoms out at its 220px minimum everywhere below 1500px, so the paper's
 * left edge is pinned at 220px no matter how narrow the viewport gets. What actually runs out is
 * the text column, which centres on the *viewport* (50vw - 280px) rather than on the paper — the
 * gap between the paper's edge and the text is `vw / 2 - 500`, i.e. 100px here and nothing at all
 * by 1000px. Below ~1160 the column crowds the paper's left edge while empty sheet piles up on the
 * right, so this is close to the floor for the current centring rule.
 *
 * CSS cannot read this value — media queries take no custom properties — so the same number is
 * repeated as `screens.paper` in tailwind.config.js (which is what the `paper:` variant compiles
 * to) and literally in the two media queries that gate the drafting grid in globals.css and the
 * rail's entrance in blog-post-rail-nav.module.css. Those four places move together.
 */
export const PAPER_BREAKPOINT = 1200

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
