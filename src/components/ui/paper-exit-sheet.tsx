"use client"

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { keepOnMainThread } from '@/lib/motion'
import {
  PAPER_EXIT_OFFSCREEN,
  PAPER_EXIT_PERSPECTIVE,
  PAPER_EXIT_REST,
  PAPER_EXIT_SHADE_LIFTED,
  PAPER_EXIT_SHADE_REST,
  PAPER_EXIT_SHADE_TRANSITION,
  PAPER_EXIT_TRANSFORM_ORIGIN,
  PAPER_EXIT_TRANSITION,
  PAPER_EXIT_TRANSITION_REDUCED,
  PAPER_LIFTOFF_OFFSCREEN,
  PAPER_LIFTOFF_REST,
  PAPER_LIFTOFF_TRANSFORM_ORIGIN,
  PAPER_LIFTOFF_TRANSITION,
  PAPER_LOOSE_SHEET_QUERY,
} from '@/lib/paper-exit-transition'

interface PaperExitSheetProps {
  /** Called once the sheet has gone, so the page can unmount it. */
  onDone: () => void
}

/**
 * The departing sheet on backwards navigation: the page that was open, leaving over the
 * destination's content, which is already settled underneath. It turns back about its right edge
 * where the paper runs off the screen, and is lifted off the desk where it sits whole on it.
 * See src/lib/paper-exit-transition.ts.
 *
 * Mounted by the destination (app/page.tsx, blog-post-layout.tsx) once it knows it was reached
 * going back, which it only learns after hydration, so this only ever renders on the client.
 */
export default function PaperExitSheet({ onDone }: PaperExitSheetProps) {
  const shouldReduceMotion = useReducedMotion()
  // Read once, as it mounts: a resize partway through shouldn't swap one exit for the other.
  const [loose] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PAPER_LOOSE_SHEET_QUERY).matches
  )

  const transition = shouldReduceMotion
    ? PAPER_EXIT_TRANSITION_REDUCED
    : loose
      ? PAPER_LIFTOFF_TRANSITION
      : PAPER_EXIT_TRANSITION

  return (
    // Clips the lifted sheet to the page, so it can't stretch the document while it tilts. Needs an
    // explicit z-index: the content below is visible during the exit, and a case study's carousel
    // children use z-[50] at the root stacking level (its paper deliberately isn't a stacking
    // context), so without one the carousel would paint above the departing sheet. z-[55] stays
    // below the sidebar (z-60).
    <div
      aria-hidden
      className="absolute inset-0 overflow-clip pointer-events-none z-[55]"
      style={PAPER_EXIT_PERSPECTIVE}
    >
      {/* As tall as the screen rather than the page: only what is on screen can be seen lifting,
          and a post's 8800px sheet would be a needlessly huge layer to tilt and blur. With 80px
          to spare below it, so the lift-off's 12px drift up never brings its bottom edge into
          view; the wrapper clips what hangs past the page. */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[calc(100lvh_+_80px)] sheet:top-[100px] sheet:h-[calc(100lvh_-_20px)]"
        style={{
          backgroundColor: 'var(--paper-bg)',
          boxShadow: 'var(--paper-box-shadow)',
          marginLeft: 'var(--paper-left)',
          maxWidth: 'var(--paper-max-w)',
          transformOrigin: loose ? PAPER_LIFTOFF_TRANSFORM_ORIGIN : PAPER_EXIT_TRANSFORM_ORIGIN,
        }}
        initial={loose ? PAPER_LIFTOFF_REST : PAPER_EXIT_REST}
        animate={loose ? PAPER_LIFTOFF_OFFSCREEN : PAPER_EXIT_OFFSCREEN}
        transition={transition}
        onAnimationComplete={onDone}
        // Without it the sheet flashes back to full opacity just before it unmounts — see
        // keepOnMainThread.
        onUpdate={keepOnMainThread}
      >
        {/* Turning about the spine, the page turns away from the light; lifted off flat, it doesn't. */}
        {!loose && (
          <motion.div
            className="absolute inset-0"
            style={{ background: 'var(--paper-exit-shade)' }}
            initial={PAPER_EXIT_SHADE_REST}
            animate={PAPER_EXIT_SHADE_LIFTED}
            transition={shouldReduceMotion ? PAPER_EXIT_TRANSITION_REDUCED : PAPER_EXIT_SHADE_TRANSITION}
          />
        )}
      </motion.div>
    </div>
  )
}
