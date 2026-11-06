"use client"

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface DescriptionBackdropProps {
  /**
   * Fit the wash to the text inside this element rather than to the box it sits in. A block that
   * wraps takes all the width it is given, however short its lines come out, so a two-line
   * description in a half-row link left its wash stretched across the whole half-row, out to the
   * edge of the tap target, well past the text. With this the wash covers the rectangle the text's
   * own lines make, and nothing else. Measured, so until hydration it covers the box as before.
   */
  fitTo?: RefObject<HTMLElement | null>
}

/**
 * The translucent plate that sits behind floating text so it stays readable over body copy without
 * reading as a separate surface. Deliberately not a card: no border, no shadow, and no straight
 * edge anywhere — a rounded wash of the page background whose own Gaussian blur *is* its falloff,
 * so it dissolves into the page on every side at once.
 *
 * It used to be a horizontal gradient crossed with a vertical mask. Two linear ramps meeting at a
 * corner still describe a rectangle, and over a dark screenshot that rectangle was plainly visible.
 * A blurred rounded shape has no corner to give away: the radius rounds the core, and the blur
 * radius sets how far the wash reaches past it.
 *
 * Two stacked layers rather than one. A single blur wide enough to fade out gently also thins the
 * cover directly under the text; the tight core keeps the text backed while the wide, faint halo
 * carries the long tail out into the page.
 *
 * 28px rather than a pill: the rail's single-line labels are short enough that this already reads
 * as fully rounded, while the multi-line link previews keep their widest line's ends covered
 * instead of having the curve bite into them.
 *
 * Shared by the inline link previews, the compact rail nav, the lightbox caption, and the footers
 * that sit on the drafting grid (a post's Previous/Next, Home's below 1024px) so they can't drift
 * apart.
 */
export function DescriptionBackdrop({ fitTo }: DescriptionBackdropProps = {}) {
  const boxRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const target = fitTo?.current
    const box = boxRef.current
    const container = box?.parentElement
    if (!target || !box || !container) return

    let frame = 0
    // The union of the text's line boxes, from its text nodes alone: an element's own box would be
    // the full-width block again. Text that isn't laid out (display: none at this width) has no
    // rects and drops out.
    const measure = () => {
      frame = 0
      const range = document.createRange()
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
      let left = Infinity
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue
        range.selectNodeContents(node)
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue
          left = Math.min(left, rect.left)
          top = Math.min(top, rect.top)
          right = Math.max(right, rect.right)
          bottom = Math.max(bottom, rect.bottom)
        }
      }
      if (left === Infinity) {
        box.style.cssText = ''
        return
      }
      const origin = container.getBoundingClientRect()
      box.style.inset = 'auto'
      box.style.left = `${left - origin.left}px`
      box.style.top = `${top - origin.top}px`
      box.style.width = `${right - left}px`
      box.style.height = `${bottom - top}px`
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }

    measure()
    const observer = new ResizeObserver(schedule)
    observer.observe(target)
    observer.observe(container)
    // The line breaks move once the webfonts land.
    document.fonts?.ready.then(schedule)
    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [fitTo])

  return (
    <span ref={boxRef} aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <span
        className="absolute -inset-x-10 -inset-y-7 rounded-[44px] blur-[20px]"
        style={{ background: 'color-mix(in srgb, var(--background) 30%, transparent)' }}
      />
      <span
        className="absolute -inset-x-6 -inset-y-4 rounded-[30px] blur-[12px]"
        style={{ background: 'color-mix(in srgb, var(--background) 48%, transparent)' }}
      />
    </span>
  )
}

export default DescriptionBackdrop
