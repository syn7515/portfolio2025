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

/** The drafting grid's cell (reveal-footer.module.css), which the footer's height is rounded to. */
const GRID_CELL = 20

/**
 * The footer's text and its padding, shared by its two copies (RevealFooterText, RevealFooter), so
 * the two come out the same size and the text in the same place.
 */
function FooterContent({ children, className, style }: Omit<RevealFooterProps, 'fromSheet'>) {
  const contentRef = useRef<HTMLDivElement>(null)

  // The grid is laid off the screen's foot, so the line under the strip's top is a whole number of
  // cells up from it. For the paper's edge to come to rest on a line too at the end of the page,
  // the footer it rests on has to be a whole number of cells tall, which its text alone won't be
  // (a 21px line, or a description that wraps to two or three). So the footer is rounded to the
  // nearest cell, by up to half a cell either way at the bottom, below the text, where the strip
  // hides the difference. Nearest rather than up, so the room under the text stays within a few
  // pixels of what the page set. Measured, and only ever on resize: before hydration the footer
  // is just off by those few pixels, at the end of the page. Each copy measures its own content,
  // which is the same content, so the two round alike.
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? content.getBoundingClientRect().height
      const round = Math.round(height / GRID_CELL) * GRID_CELL - height
      content.parentElement?.style.setProperty('--reveal-footer-round', `${round}px`)
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Below 1024px, the same for every page: the text two grid cells (40px) under the paper's
          edge, so it reads as hanging off the edge it was uncovered from, and its top lies on a
          line; under it, the strip and one cell more, which keeps the text and its tap targets
          clear of the strip and sets the footer no higher on the screen than it needs to be. 120px
          of desk on a phone for a one-line footer, 140px from 640px.
          From 1024px, where only the case studies have one, it hangs from the sheet as it always
          has. */}
      <div
        ref={contentRef}
        className={cn(
          'relative px-6 sheet:px-0 pt-10 pb-[calc(var(--reveal-band-h)_+_20px)] sheet:pt-12 sheet:pb-24',
          className
        )}
        style={style}
      >
        {/* From 1024px (only ever shown there with fromSheet) the column lines up with the sheet's
            text column rather than centring on the screen: the case-study column's own formula in
            blog-post-layout.tsx, measured from the viewport's left edge here instead of the
            sheet's, which is why it leaves out --paper-left. */}
        <div className="max-w-[var(--content-w)] mx-auto sheet:max-w-none sheet:w-[var(--content-w)] sheet:ml-[calc(50vw_-_var(--content-w)_/_2_+_var(--paper-center-offset))]">
          {children}
        </div>
      </div>
      <div aria-hidden className={styles.cellRound} />
    </>
  )
}

/**
 * The footer as it is seen: fixed to the foot of the screen, behind the paper, so the paper slides
 * off it and it never moves — not as the page scrolls, and not as an overscroll pulls the paper
 * past the end of the page and back. It is what the reader sees, taps and hovers. Being behind the
 * paper is a matter of document order (a z-index on the paper would trap a case study's carousel
 * under the top fade), so it goes before the paper — after PaperGridBackground, and after RevealDesk
 * where there is one — and RevealFooter after the paper keeps the same footer's place in the
 * reading order (see that component).
 *
 * Out of the reading order itself: hidden from assistive technology, and the page has to keep its
 * links out of the tab order (tabIndex={-1}), since this copy comes before the article.
 */
export function RevealFooterText({ children, className, style, fromSheet = false }: RevealFooterProps) {
  return (
    <div aria-hidden className={cn(styles.text, fromSheet && styles.fromSheet)}>
      <FooterContent className={className} style={style}>
        {children}
      </FooterContent>
    </div>
  )
}

/**
 * The footer under the full-bleed paper, below 1024px: the desk the paper is lifted off, with the
 * drafting grid and whatever the page ends on, uncovered as the paper scrolls up off it. It goes
 * with RevealBand, the strip of desk held across the foot of the screen the whole way down, which
 * the paper's edge rests on until the paper runs out (see reveal-footer.module.css); that one is
 * placed early in the page, not here.
 *
 * What the reader sees is RevealFooterText, the same content fixed to the screen behind the paper.
 * This is the footer's place in the page: it gives the page the room to scroll the paper off the
 * footer, and it keeps the footer after the article for screen readers and the keyboard. It is
 * never seen or touched, except that it shows while a keyboard has focus in it, sitting exactly
 * where the copy behind the paper does.
 *
 * Place it directly after the paper and give the paper `revealPaperClassName`. From 1024px it
 * renders nothing, and the page keeps its footer on the sheet, unless `fromSheet` asks for it there
 * too.
 */
export default function RevealFooter({ children, className, style, fromSheet = false }: RevealFooterProps) {
  return (
    <>
      <div aria-hidden className={styles.edge} />
      <div className={cn(styles.footer, fromSheet && styles.fromSheet)}>
        <div className={styles.track}>
          <div className={styles.pinned}>
            <FooterContent className={className} style={style}>
              {children}
            </FooterContent>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * The strip of desk held across the foot of the screen below 1024px, with its copy of the paper's
 * edge, and the fade over the text just above it (see reveal-footer.module.css). Renders nothing
 * from 1024px.
 *
 * Its own component, for where it goes in the document: early, directly after PaperGridBackground,
 * not after the paper with RevealFooter. Being fixed and z-indexed, it looks the same wherever it
 * sits in the DOM, but Safari paints a page as its HTML comes in, and after the paper it was among
 * the last 15% of a long case study's markup. When the HTML came in slowly, as on a first visit or
 * just after a deploy, the article was up on the screen for as long as that took with no strip
 * under it, and the paper ran on under the toolbar instead, as if the page had none. Up front it
 * arrives with the desk's own grid, in the first few kilobytes.
 *
 * Must sit under the same parent as PaperGridBackground, which finds the strip's grid there to
 * light the pointer spotlight.
 */
export function RevealBand() {
  return (
    <>
      {/* The grid is a global class, shared with PaperGridBackground's own below 1024px
          (globals.css), so the two can't drift apart. */}
      <div aria-hidden className={styles.band}>
        <div data-paper-grid-pointer className="paper-grid-strip" />
        <div className={styles.bandEdge} />
      </div>
      <div aria-hidden className={styles.bottomFade} />
    </>
  )
}
