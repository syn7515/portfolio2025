"use client"

import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import styles from './reveal-footer.module.css'

/**
 * Goes on the paper the footer comes out from under (alongside its `paper-grid-bottom`). Below
 * 1024px it takes the drafting grid off the paper's bottom edge, since the footer carries it
 * instead. See reveal-footer.module.css.
 */
export const revealPaperClassName = styles.revealPaper

interface RevealFooterProps {
  children: ReactNode
  /** On the padded content block: the page's own entrance classes and timing. */
  className?: string
  style?: CSSProperties
  /**
   * Also come out from under the sheet from 1024px, where the paper floats on the desk, instead of
   * rendering nothing there and leaving the page to keep its footer on the sheet. There it is just
   * the text, on a desk RevealDesk holds still; see that component for the page structure both
   * need.
   */
  fromSheet?: boolean
}

/**
 * From 1024px, with `<RevealFooter fromSheet>`: holds the desk still while the sheet slides up off
 * the footer, by laying a copy of PaperGridBackground's grid over the last stretch of the page and
 * pinning it to the screen for the length of the reveal.
 *
 * The page wrapper must be a one-column grid (`minmax(0, 1fr)`), the page in its first row and the
 * footer in its second, with this placed after PaperGridBackground and before the paper — so that it
 * paints between the two — and the footer after the paper. It takes the footer's cell itself.
 */
export function RevealDesk() {
  const trackRef = useRef<HTMLDivElement>(null)

  // The copy has to continue PaperGridBackground's lattice exactly until it pins, and that lattice
  // is anchored to the top of the page, which is the one thing CSS can't measure this from. So the
  // track's offset from the wrapper goes in a custom property. It only moves when the page's
  // height or the viewport's does, never as the page scrolls, so a ResizeObserver covers it.
  useEffect(() => {
    const track = trackRef.current
    const wrapper = track?.parentElement
    if (!track || !wrapper) return

    const measure = () => {
      const top = track.getBoundingClientRect().top - wrapper.getBoundingClientRect().top
      track.style.setProperty('--reveal-desk-top', `${top}px`)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div ref={trackRef} aria-hidden className={styles.deskTrack}>
      <div className={styles.desk}>
        <div data-paper-grid-pointer className={styles.deskGrid} />
      </div>
    </div>
  )
}

/**
 * The footer under the full-bleed paper, below 1024px: the desk the paper is lifted off, with the
 * drafting grid and whatever the page ends on. It holds still while the paper scrolls up off it.
 * Place it directly after the paper and give the paper `revealPaperClassName`. From 1024px it
 * renders nothing, and the page keeps its footer on the sheet, unless `fromSheet` asks for it there
 * too.
 *
 * Must sit under the same parent as PaperGridBackground, which finds its grid there to light the
 * pointer spotlight.
 */
export default function RevealFooter({ children, className, style, fromSheet = false }: RevealFooterProps) {
  return (
    <div className={cn(styles.footer, fromSheet && styles.fromSheet)}>
      <div className={styles.track}>
        <div className={styles.pinned}>
          <div aria-hidden data-paper-grid-pointer className={styles.grid} />
          {/* Weighted toward the paper, half the room above that it has below, so the content
              reads as hanging off the edge it was uncovered from rather than floating mid-desk,
              and clears the grid's fade into the bottom of the viewport. */}
          <div
            className={cn('relative px-6 sheet:px-0 pt-10 pb-20 min-[640px]:pt-12 min-[640px]:pb-24', className)}
            style={style}
          >
            {/* From 1024px (only ever shown there with fromSheet) the column lines up with the
                sheet's text column rather than centring on the screen: the case-study column's
                own offsets in blog-post-layout.tsx, measured from the viewport's left edge here
                instead of the sheet's, which is why --paper-left is added back. */}
            <div className="max-w-[var(--content-w)] mx-auto sheet:max-w-none sheet:w-[var(--content-w)] sheet:ml-[calc(var(--paper-left)_+_100px_+_var(--paper-center-offset))] paper:ml-[calc(50vw_-_var(--content-w)_/_2_+_var(--paper-center-offset))]">
              {children}
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className={styles.edge} />
    </div>
  )
}
