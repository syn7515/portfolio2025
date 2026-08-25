// Shared "paper slides out" exit animation for backwards navigation out of a blog post — via the
// footer Previous link or the sidebar Home link. Makes the departure read as the current sheet
// leaving toward the top-right corner (where papers come from), revealing the destination's content
// already sitting on the paper underneath, rather than a hard cut or a new paper sliding in over a
// blank page. Shared between blog-post-layout.tsx and app/page.tsx so both exits feel identical.

const PAPER_EXIT_OFFSET_X = 40
const PAPER_EXIT_OFFSET_Y = -32
const PAPER_EXIT_ROTATE_DEG = 2
const PAPER_EXIT_BLUR_PX = 10

export const PAPER_EXIT_REST = { x: 0, y: 0, rotate: 0, filter: 'blur(0px)', opacity: 1 }
export const PAPER_EXIT_OFFSCREEN = {
  x: PAPER_EXIT_OFFSET_X,
  y: PAPER_EXIT_OFFSET_Y,
  rotate: PAPER_EXIT_ROTATE_DEG,
  filter: `blur(${PAPER_EXIT_BLUR_PX}px)`,
  opacity: 0,
}

// Match the entrance's decisive ease-out: the sheet launches immediately, then sheds velocity
// smoothly as it clears the viewport instead of starting slowly and accelerating away.
const EXIT_EASE: [number, number, number, number] = [0.23, 1, 0.32, 1]
const EXIT_DURATION = 0.7
// Opacity gets a head-start delay so the sheet stays visibly solid while the slide/rotate/blur are
// just getting going, rather than dissolving from the very first frame. The fade then compresses
// into the remaining time so it still finishes exactly when the rest of the animation does.
const EXIT_OPACITY_DELAY = 0.2

const EXIT_TRANSITION_FULL = { duration: EXIT_DURATION, ease: EXIT_EASE }
const EXIT_OPACITY_TRANSITION_FULL = {
  duration: EXIT_DURATION - EXIT_OPACITY_DELAY,
  ease: EXIT_EASE,
  delay: EXIT_OPACITY_DELAY,
}
const EXIT_TRANSITION_REDUCED = { duration: 0 }

// Per-property transition map: x/y/rotate/filter use `default`, opacity gets its own delayed
// pacing. Kept as stable module-level references (not built inline at each call site) so an
// unrelated re-render never hands Framer Motion a new object reference for an in-flight tween.
export const PAPER_EXIT_TRANSITION = { default: EXIT_TRANSITION_FULL, opacity: EXIT_OPACITY_TRANSITION_FULL }
export const PAPER_EXIT_TRANSITION_REDUCED = { default: EXIT_TRANSITION_REDUCED, opacity: EXIT_TRANSITION_REDUCED }

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
