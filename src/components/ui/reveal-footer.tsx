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
}

/**
 * The footer under the full-bleed paper, below 1024px: the desk the paper is lifted off, with the
 * drafting grid and whatever the page ends on. It holds still while the paper scrolls up off it.
 * Place it directly after the paper and give the paper `revealPaperClassName`; from 1024px it
 * renders nothing, and the page keeps its footer on the sheet.
 *
 * Must sit under the same parent as PaperGridBackground, which finds its grid there to light the
 * pointer spotlight.
 */
export default function RevealFooter({ children, className, style }: RevealFooterProps) {
  return (
    <div className={styles.footer}>
      <div className={styles.track}>
        <div className={styles.pinned}>
          <div aria-hidden data-paper-grid-pointer className={styles.grid} />
          {/* Weighted toward the paper, half the room above that it has below, so the content
              reads as hanging off the edge it was uncovered from rather than floating mid-desk,
              and clears the grid's fade into the bottom of the viewport. */}
          <div
            className={cn('relative px-6 pt-10 pb-20 min-[640px]:pt-12 min-[640px]:pb-24', className)}
            style={style}
          >
            <div className="max-w-[var(--content-w)] mx-auto">{children}</div>
          </div>
        </div>
      </div>
      <div aria-hidden className={styles.edge} />
    </div>
  )
}
