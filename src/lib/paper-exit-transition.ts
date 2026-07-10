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

// Accelerate curve (Material Design's standard exit easing): speeds up continuously with no
// decelerating tail, since the sheet is leaving the screen rather than settling into place.
const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1]
const EXIT_DURATION = 0.3
// Opacity gets a head-start delay so the sheet stays visibly solid while the slide/rotate/blur are
// just getting going, rather than dissolving from the very first frame. The fade then compresses
// into the remaining time so it still finishes exactly when the rest of the animation does.
const EXIT_OPACITY_DELAY = 0.1

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

// sessionStorage signal set by the departing link's onClick, read once by the destination page's
// mount effect (never during render — see blog-post-layout.tsx for why: reading client-only storage
// synchronously during render would diverge from the server-rendered markup on an actual SSR pass).
export const PAPER_BACK_NAV_FLAG = 'paper-direction'
export const PAPER_BACK_NAV_VALUE = 'back'
