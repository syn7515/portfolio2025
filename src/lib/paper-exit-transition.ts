// Shared "page lifts away" exit animation for backwards navigation out of a blog post — via the
// footer Previous link or the sidebar Home link. The current sheet turns back about its right edge,
// the way the page you are reading goes back over a notebook's spine: its outer edge lifts toward
// you, and before it can stand up it is gone, blurred out, revealing the destination's content
// already sitting on the paper underneath. It is only the start of a page turn, the way the
// entrance's settle is only the end of one, and that is enough to read as one without drawing
// the eye off the page. Played by ui/paper-exit-sheet.tsx, for blog-post-layout.tsx and
// app/page.tsx alike.
//
// That is wherever the paper runs off the right of the screen. From the centred breakpoint it sits
// whole on the desk, a margin either side, and reads as a loose printed sheet rather than a page:
// there it is lifted off the desk instead (PAPER_LIFTOFF_* below), its entrance there, being laid
// down rather than turned (page.module.css, blog-post.module.css), run backwards.

import { PAPER_CENTERED_BREAKPOINT } from '@/lib/breakpoints'

/** Where the sheet reads as a loose sheet rather than a notebook's page. */
export const PAPER_LOOSE_SHEET_QUERY = `(min-width: ${PAPER_CENTERED_BREAKPOINT}px)`

/** How far the sheet lifts before it is gone. At 22deg its outer edge has come ~420px off the page
    toward you and looks a fifth taller, its top corner standing ~65px over the paper's top edge,
    which is what says "lifted". */
const PAPER_EXIT_LIFT_DEG = 22
const PAPER_EXIT_BLUR_PX = 8

/** The hinge: the sheet's right edge, which is the screen's right edge wherever the paper runs off
    it, and the sheet's own edge where it has a margin. */
export const PAPER_EXIT_TRANSFORM_ORIGIN = '100% 50%'

/** Goes on the departing sheet's wrapper, which spans the page from its top: the lift is seen from
    the middle of the screen, from far enough off that the sheet tilts rather than looms. */
export const PAPER_EXIT_PERSPECTIVE = { perspective: '2400px', perspectiveOrigin: '50% 50vh' }

export const PAPER_EXIT_REST = { rotateY: 0, filter: 'blur(0px)', opacity: 1 }
export const PAPER_EXIT_OFFSCREEN = {
  rotateY: PAPER_EXIT_LIFT_DEG,
  filter: `blur(${PAPER_EXIT_BLUR_PX}px)`,
  opacity: 0,
}

/** The sheet turning away from the light as it lifts: a shade over it, even, since it stays flat.
    (A fade toward the outer edge stepped visibly, being so faint.) Its colour is
    --paper-exit-shade in globals.css. */
export const PAPER_EXIT_SHADE_REST = { opacity: 0 }
export const PAPER_EXIT_SHADE_LIFTED = { opacity: 1 }

const EXIT_DURATION = 0.55
// The lift has to be seen before the sheet fades, so it moves first and briskly — ~9deg by 150ms —
// then slows as the sheet goes.
const EXIT_LIFT_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
// Then the fade, from 120ms, easing in and out so the sheet is still half there at 300ms, ~18deg up.
const EXIT_FADE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1]
const EXIT_FADE_DELAY = 0.12

const EXIT_LIFT_TRANSITION_FULL = { duration: EXIT_DURATION, ease: EXIT_LIFT_EASE }
const EXIT_FADE_TRANSITION_FULL = {
  duration: EXIT_DURATION - EXIT_FADE_DELAY,
  ease: EXIT_FADE_EASE,
  delay: EXIT_FADE_DELAY,
}
const EXIT_TRANSITION_REDUCED = { duration: 0 }

// Per-property transition map: the lift on its own pacing, opacity and blur on the fade's. Kept as
// stable module-level references (not built inline at each call site) so an unrelated re-render
// never hands Framer Motion a new object reference for an in-flight tween.
export const PAPER_EXIT_TRANSITION = {
  rotateY: EXIT_LIFT_TRANSITION_FULL,
  opacity: EXIT_FADE_TRANSITION_FULL,
  filter: EXIT_FADE_TRANSITION_FULL,
}
export const PAPER_EXIT_TRANSITION_REDUCED = { default: EXIT_TRANSITION_REDUCED }
export const PAPER_EXIT_SHADE_TRANSITION = EXIT_LIFT_TRANSITION_FULL

// The loose sheet's shadow, none of its own while it lies on the desk (the paper's box-shadow
// covers that) and spread wide once it is off it.
const LOOSE_SHADOW_DOWN = 'drop-shadow(0px 0px 0px rgba(0, 0, 0, 0))'
const LOOSE_SHADOW_UP = 'drop-shadow(0px 40px 48px rgba(0, 0, 0, 0.14))'

// The loose sheet, lifted straight off the desk: its entrance there (being laid down,
// page.module.css) run backwards. It drifts 16px right and 12px up, back toward the top right where
// sheets come from, comes up 2.5% larger and turns 0.8deg out of square about the middle of what
// is on screen, its shadow spreading and its focus going as it comes toward you, all from the start
// on the lift's pacing; then it fades, as the page does.
export const PAPER_LIFTOFF_TRANSFORM_ORIGIN = '50% 50%'
export const PAPER_LIFTOFF_REST = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  filter: `blur(0px) ${LOOSE_SHADOW_DOWN}`,
  opacity: 1,
}
export const PAPER_LIFTOFF_OFFSCREEN = {
  x: 16,
  y: -12,
  scale: 1.025,
  rotate: 0.8,
  filter: `blur(${PAPER_EXIT_BLUR_PX}px) ${LOOSE_SHADOW_UP}`,
  opacity: 0,
}
export const PAPER_LIFTOFF_TRANSITION = {
  x: EXIT_LIFT_TRANSITION_FULL,
  y: EXIT_LIFT_TRANSITION_FULL,
  scale: EXIT_LIFT_TRANSITION_FULL,
  rotate: EXIT_LIFT_TRANSITION_FULL,
  filter: EXIT_LIFT_TRANSITION_FULL,
  opacity: EXIT_FADE_TRANSITION_FULL,
}

// Backwards-navigation signal, carried on two channels because it has to survive both kinds of
// navigation and be readable before the destination's first paint:
//
//   - an attribute on <html>, which is what the destination's CSS actually branches on. Set
//     synchronously in the departing link's onClick, so on a client-side navigation (every in-app
//     link is a next/link) it is already in place when the new page renders its first frame.
//   - sessionStorage, which is the only one of the two that survives a full document load. The
//     inline script in app/layout.tsx promotes it back onto <html> before first paint.
//
// The entrance animation is pure CSS precisely so it doesn't wait for hydration (see
// blog-post.module.css), which means the "should I animate at all?" answer has to be available to
// CSS at paint time. A React state flag set in a mount effect would arrive a frame too late.
export const PAPER_BACK_NAV_FLAG = 'paper-direction'
export const PAPER_BACK_NAV_VALUE = 'back'
export const PAPER_HOME_FORWARD_NAV_VALUE = 'home'
export const PAPER_BACK_NAV_ATTR = 'data-paper-nav'
const MOBILE_PAGE_TRANSITION_QUERY = '(max-width: 639.98px)'

export function shouldSkipPaperPageTransition() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_PAGE_TRANSITION_QUERY).matches
}

function clearPaperNavigationSignal() {
  try {
    sessionStorage.removeItem(PAPER_BACK_NAV_FLAG)
  } catch {
    // Nothing to undo if storage is unavailable.
  }
  document.documentElement.removeAttribute(PAPER_BACK_NAV_ATTR)
}

// Called by the departing link, before the route change.
export function markPaperBackNav() {
  if (shouldSkipPaperPageTransition()) {
    clearPaperNavigationSignal()
    return
  }

  try {
    sessionStorage.setItem(PAPER_BACK_NAV_FLAG, PAPER_BACK_NAV_VALUE)
  } catch {
    // Private-mode / storage-disabled: the attribute below still covers client-side navigation,
    // which is the only path an in-app link takes.
  }
  document.documentElement.setAttribute(PAPER_BACK_NAV_ATTR, PAPER_BACK_NAV_VALUE)
}

// Called by case-study links on Home. Unlike the backwards signal, this does not alter the paper
// entrance; it gives responsive navigation chrome a pre-paint origin so it can enter from the same
// viewport edge it belongs to.
export function markPaperHomeForwardNav() {
  if (shouldSkipPaperPageTransition()) {
    clearPaperNavigationSignal()
    return
  }

  try {
    sessionStorage.setItem(PAPER_BACK_NAV_FLAG, PAPER_HOME_FORWARD_NAV_VALUE)
  } catch {
    // The attribute still covers the normal client-side navigation path.
  }
  document.documentElement.setAttribute(PAPER_BACK_NAV_ATTR, PAPER_HOME_FORWARD_NAV_VALUE)
}

export function isPaperBackNav() {
  if (shouldSkipPaperPageTransition()) {
    clearPaperNavigationSignal()
    return false
  }

  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute(PAPER_BACK_NAV_ATTR) === PAPER_BACK_NAV_VALUE
  )
}

export function isPaperHomeForwardNav() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute(PAPER_BACK_NAV_ATTR) === PAPER_HOME_FORWARD_NAV_VALUE
  )
}

// Called once the departing sheet has finished leaving, so the next forward navigation animates
// its entrance normally.
export function clearPaperBackNav() {
  try {
    sessionStorage.removeItem(PAPER_BACK_NAV_FLAG)
  } catch {
    // Nothing to undo if it was never written.
  }
  document.documentElement.removeAttribute(PAPER_BACK_NAV_ATTR)
}

// A full-document reload keeps the reader where they were — the UA's own scroll restoration is
// deliberately left on for that one navigation type (see the inline script in app/layout.tsx). A
// sheet flying in over content that is already scrolled halfway down reads as a glitch rather than
// an arrival, and a reload isn't an arrival, so the entrances sit this one out.
//
// Same pre-paint contract as the direction signal above, and for the same reason: both entrances
// are CSS, so they start on the first painted frame and the answer has to be there before it. The
// attribute is set by that inline script; the page then captures it into its durable no-entrance
// class and calls clearPageReload, because leaving it on <html> would suppress the *next* route's
// entrance too.
export const PAGE_RELOAD_ATTR = 'data-page-reload'

export function isPageReload() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.hasAttribute(PAGE_RELOAD_ATTR)
  )
}

export function clearPageReload() {
  document.documentElement.removeAttribute(PAGE_RELOAD_ATTR)
}

export function clearPaperHomeForwardNav() {
  try {
    if (sessionStorage.getItem(PAPER_BACK_NAV_FLAG) === PAPER_HOME_FORWARD_NAV_VALUE) {
      sessionStorage.removeItem(PAPER_BACK_NAV_FLAG)
    }
  } catch {
    // Nothing to undo if it was never written.
  }

  if (document.documentElement.getAttribute(PAPER_BACK_NAV_ATTR) === PAPER_HOME_FORWARD_NAV_VALUE) {
    document.documentElement.removeAttribute(PAPER_BACK_NAV_ATTR)
  }
}
