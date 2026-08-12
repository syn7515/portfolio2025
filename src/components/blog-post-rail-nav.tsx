"use client"

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToc } from '@/components/use-toc'
import { DescriptionBackdrop } from '@/components/ui/description-backdrop'
import { markPaperBackNav } from '@/lib/paper-exit-transition'
import styles from './blog-post-rail-nav.module.css'

interface BlogPostRailNavProps {
  contentSelector?: string
}

// Section labels keep the TOC's own Crimson Pro. The Home tooltip deliberately does *not* use this
// — it mirrors the ≥1280px sidebar's Home link instead (sans, text-sm, font-[460]), so the same
// control reads the same way at every width.
const TOC_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-crimson-pro), serif',
  fontSize: '18px',
  fontWeight: 450,
  letterSpacing: '-0.02em',
}

/**
 * Home + table of contents for 820–1280px.
 *
 * At ≥1280px this is the fixed text sidebar; below 820px it's the hamburger overlay. In between,
 * --sidebar-w collapses to 0px and the paper runs edge to edge, so there is no gutter to put a
 * text rail in — the outline collapses to tick marks that expand on hover, and Home becomes a ghost
 * icon button sitting above them.
 *
 * Everything floats over body copy, which is why the labels carry DescriptionBackdrop.
 */
export default function BlogPostRailNav({ contentSelector }: BlogPostRailNavProps) {
  const { items, activeId, goTo } = useToc(contentSelector)
  const hasHoveredItemRef = useRef(false)
  const [showTitlesInstantly, setShowTitlesInstantly] = useState(false)

  const handleRailMouseLeave = () => {
    hasHoveredItemRef.current = false
    setShowTitlesInstantly(false)
  }

  const handleItemMouseEnter = () => {
    if (hasHoveredItemRef.current) {
      setShowTitlesInstantly(true)
      return
    }

    hasHoveredItemRef.current = true
  }

  return (
    <div
      className={cn(
        'hidden min-[820px]:flex min-[1280px]:hidden',
        // Vertically centred so the cluster stays reachable at any scroll position without being
        // fixed to an edge. The left offset opens up as the gutter does: at 820px space remains
        // tight between the viewport edge and text column, while at 1200px there is ~300px.
        'fixed left-2 min-[820px]:left-6 min-[1024px]:left-10 top-1/2 -translate-y-1/2 z-60',
        'flex-col items-start gap-5'
      )}
      aria-label="Post navigation"
    >
      {/* Home — the third of three Home affordances (sidebar, hamburger, here). All must flag the
          departure as backwards, or this one would slide a fresh sheet in while the others slide
          the current one out. */}
      <Link
        href="/"
        onClick={markPaperBackNav}
        aria-label="Back to home"
        className={cn(
          styles.homeButton,
          'relative grid size-8 place-items-center rounded-full',
          // Type and colour copied from the ≥1280px sidebar Home link so the two are the same
          // control. No hover background: the label below is the hover affordance, and it and the
          // icon both take the orange together — a tint behind the icon on top of that read as two
          // competing signals for one state.
          'text-sm font-[460] !not-italic !no-underline !text-stone-400 dark:!text-zinc-400',
          'hover:!text-orange-700 dark:hover:!text-orange-400',
          'motion-safe:active:scale-[0.97]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600/60 dark:focus-visible:ring-orange-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background'
        )}
        style={{
          transition: 'color 300ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <Undo2 className="size-4 flex-shrink-0 -translate-y-px" aria-hidden />
        {/* No -translate-y-1/2 here: Tailwind v4 compiles it to the `translate` property that
            styles.reveal already drives, so it would be overwritten and the label would hang half
            its height too low. The centring lives in that class instead.
            No colour of its own either — inheriting from the link is what lets it turn orange with
            the icon on hover. */}
        <span
          aria-hidden
          className={cn(
            styles.reveal,
            'absolute left-[calc(100%+10px)] top-1/2 isolate whitespace-nowrap'
          )}
        >
          <DescriptionBackdrop />
          <span className="relative z-10">Home</span>
        </span>
      </Link>

      {/* A continuous 14px row pitch keeps the ticks reading as one dense stroke pattern. Each row
          owns the full pitch and the horizontal space up to its label, maximizing the hit target
          without changing the marks' visual spacing or introducing overlapping targets. */}
      {items.length > 0 && (
        <nav
          aria-label="Table of contents"
          onMouseLeave={handleRailMouseLeave}
          className={cn(
            styles.rail,
            showTitlesInstantly && styles.railTitlesInstant,
            'flex flex-col items-start gap-0 py-1 pl-2'
          )}
        >
          {items.map(({ id, text }) => {
            const isActive = activeId === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                onMouseEnter={handleItemMouseEnter}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  styles.tickRow,
                  isActive && styles.tickRowActive,
                  // The 44px box spans from the rail container's left edge to the label edge; its
                  // padding keeps the tick at the original x-position. A 14px height fills the
                  // complete row pitch, so neighboring targets remain contiguous, not overlapping.
                  'relative -ml-2 flex h-[14px] w-11 cursor-pointer items-center rounded-sm pl-2',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600/60 dark:focus-visible:ring-orange-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'motion-safe:active:scale-[0.97]'
                )}
              >
                <span aria-hidden className={cn(styles.tick, isActive && styles.tickActive)} />
                <span
                  className={cn(
                    styles.reveal,
                    'absolute left-full top-1/2 isolate whitespace-nowrap text-left',
                    isActive ? 'text-stone-800 dark:text-zinc-100' : 'text-stone-500 dark:text-zinc-400'
                  )}
                  style={TOC_LABEL_STYLE}
                >
                  <DescriptionBackdrop />
                  <span className="relative z-10">{text}</span>
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
