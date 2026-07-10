"use client"

import { MotionConfig } from 'framer-motion'
import React from 'react'

/**
 * App-wide reduced-motion baseline for Framer Motion.
 *
 * `reducedMotion="user"` makes every `motion.*` element honor the OS
 * "prefers-reduced-motion" setting automatically: transform/position/scale
 * animations are skipped (they jump straight to their target) while opacity and
 * color still animate. This covers the components that don't branch on
 * `useReducedMotion` themselves (carousel, lightbox, indicators, list items,
 * inline previews). The CSS `@media (prefers-reduced-motion: reduce)` block in
 * globals.css handles pure-CSS keyframes/transitions, which this cannot reach.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
