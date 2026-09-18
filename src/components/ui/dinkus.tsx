import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

// Dinkus: three asterisks, used both as the home page's end-of-content mark and as the one closing
// a case study above its navigation footer. Set in the title serif at the size of the metadata
// column, so it reads as a typographic mark in the page's own voice rather than a widget.
//
// It lives here rather than being written out at each call site because the offset below is
// measured against the rendered glyph — a value that is wrong the moment it is copied and one of
// the copies is adjusted.
const DINKUS_FONT_SIZE_PX = 16
// Traditional dinkus spacing is roughly an em between marks. Crimson Pro's asterisk advances
// ~0.43em, so an 8px flex gap puts glyph centres just under an em apart at this size.
// This is deliberately the container's gap rather than letter-spacing on the glyphs: each span
// holds a single character, so letter-spacing would only pad its right-hand side, adding a trailing
// space that pushes the group off centre without separating anything.
// The asterisk's ink hangs high in the em box. Measured on the rendered glyph in Crimson Pro: the
// ink spans 0.342em to 0.682em above the baseline, putting its centre 0.512em up while the line
// box's own centre (at line-height 1) sits lower. Translating down by the difference lands the ink
// on the block's optical centre, so the symmetric margins above and below read as symmetric.
// Re-measure if the display face ever changes.
const DINKUS_INK_OFFSET_EM = 0.178
const DINKUS_STYLE: CSSProperties = {
  fontFamily: 'var(--font-crimson-pro), serif',
  fontSize: `${DINKUS_FONT_SIZE_PX}px`,
  lineHeight: 1,
  transform: `translateY(${DINKUS_INK_OFFSET_EM}em)`,
}

interface DinkusProps {
  /** Spacing and visibility for the slot it sits in; the mark itself carries none. */
  className?: string
  style?: CSSProperties
}

export default function Dinkus({ className, style }: DinkusProps) {
  return (
    <div
      aria-hidden
      className={cn('flex items-center justify-center gap-[8px]', className)}
      style={style}
    >
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="text-stone-400 dark:text-zinc-600 select-none"
          style={DINKUS_STYLE}
        >
          *
        </span>
      ))}
    </div>
  )
}
