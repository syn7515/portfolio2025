"use client"

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Undo2 } from 'lucide-react'
import { cn, prefersReducedMotion } from '@/lib/utils'
import { useToc } from '@/components/use-toc'
import { DescriptionBackdrop } from '@/components/ui/description-backdrop'
import {
  clearPaperHomeForwardNav,
  isPaperHomeForwardNav,
  markPaperBackNav,
} from '@/lib/paper-exit-transition'
import styles from './blog-post-rail-nav.module.css'

interface BlogPostRailNavProps {
  contentSelector?: string
}

// Section labels keep the TOC's own Crimson Pro. They are the only labels in the rail — Home is a
// bare icon here, so nothing else needs this.
const TOC_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-crimson-pro), serif',
  fontSize: '18px',
  fontWeight: 450,
  letterSpacing: '-0.02em',
}

const RAIL_EXIT_MS = 180
const TITLE_HOVER_SESSION_MS = 2500

/**
 * Home + table of contents for 820–1024px and 1064–1200px.
 *
 * At ≥1200px this is the fixed text sidebar; below 820px it's the hamburger overlay. In between,
 * --sidebar-w collapses to 0px, so there is no gutter wide enough for a text rail — the outline
 * collapses to tick marks that expand on hover, and Home becomes a ghost icon button sitting above
 * them. Up to 1024px it floats over the full-bleed paper; from there it sits on the drafting grid in
 * the sheet's left margin, and between 1024 and 1064px, where that margin is too narrow to hold it
 * (RAIL_BREAKPOINT below), it is not shown at all.
 *
 * Everything floats over body copy, which is why the labels carry DescriptionBackdrop.
 */
export default function BlogPostRailNav({ contentSelector }: BlogPostRailNavProps) {
  const router = useRouter()
  const { items, activeId, goTo } = useToc(contentSelector)
  const railNavRef = useRef<HTMLDivElement>(null)
  const exitAnimationRef = useRef<Animation | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const titleHoverSessionTimerRef = useRef<number | null>(null)
  const isLeavingRef = useRef(false)
  const hasHoveredTitleRef = useRef(false)
  const [showTitlesInstantly, setShowTitlesInstantly] = useState(false)

  // CSS reads the Home-origin attribute before first paint. Clear its one-navigation lifetime once
  // the entrance has had time to finish; animationend normally clears it sooner. The fallback also
  // covers viewports where this rail is hidden and reduced-motion users, where no animation fires.
  useEffect(() => {
    if (!isPaperHomeForwardNav()) return
    // Intentionally let this short fallback survive an early unmount so the session signal cannot
    // leak into a later, unrelated navigation.
    window.setTimeout(clearPaperHomeForwardNav, 550)
  }, [])

  useEffect(() => () => {
    if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
    if (titleHoverSessionTimerRef.current) window.clearTimeout(titleHoverSessionTimerRef.current)
    exitAnimationRef.current?.cancel()
  }, [])

  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Preserve native new-tab/window behavior without leaving this document in a navigation state.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    if (isLeavingRef.current) return
    isLeavingRef.current = true

    const railNav = railNavRef.current
    if (!railNav || prefersReducedMotion()) {
      markPaperBackNav()
      router.push('/')
      return
    }

    // Capture the presentation values before markPaperBackNav changes the pre-paint attribute and
    // potentially cancels an in-progress entrance. A quick reversal therefore softens from the
    // rail's exact current opacity and blur instead of flashing to its settled state first.
    const computedStyle = window.getComputedStyle(railNav)
    const currentOpacity = computedStyle.opacity
    const currentFilter = computedStyle.filter

    markPaperBackNav()

    let hasNavigated = false
    const navigateHome = () => {
      if (hasNavigated) return
      hasNavigated = true
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
      router.push('/')
    }

    try {
      exitAnimationRef.current = railNav.animate(
        [
          { opacity: currentOpacity, filter: currentFilter },
          { opacity: '0', filter: 'blur(4px)' },
        ],
        {
          duration: RAIL_EXIT_MS,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'forwards',
        }
      )
    } catch {
      navigateHome()
      return
    }
    railNav.style.pointerEvents = 'none'
    exitAnimationRef.current.onfinish = navigateHome
    exitTimerRef.current = window.setTimeout(navigateHome, RAIL_EXIT_MS + 100)
  }

  // The rail's titles share one reveal session: the first costs the full intentional reveal, the
  // rest behave like adjacent tooltips. Home used to prime this, back when it revealed a label of
  // its own. It no longer does, so it no longer opens a session the reader has seen nothing of.
  const handleTitleMouseEnter = () => {
    if (titleHoverSessionTimerRef.current) {
      window.clearTimeout(titleHoverSessionTimerRef.current)
      titleHoverSessionTimerRef.current = null
    }

    setShowTitlesInstantly(hasHoveredTitleRef.current)
    hasHoveredTitleRef.current = true
  }

  const handleTitleMouseLeave = () => {
    if (titleHoverSessionTimerRef.current) {
      window.clearTimeout(titleHoverSessionTimerRef.current)
    }
    titleHoverSessionTimerRef.current = window.setTimeout(() => {
      hasHoveredTitleRef.current = false
      setShowTitlesInstantly(false)
      titleHoverSessionTimerRef.current = null
    }, TITLE_HOVER_SESSION_MS)
  }

  return (
    <div
      ref={railNavRef}
      onAnimationEnd={(event) => {
        if (event.currentTarget === event.target) clearPaperHomeForwardNav()
      }}
      className={cn(
        styles.railNav,
        showTitlesInstantly && styles.titlesInstant,
        // RAIL_BREAKPOINT: 24px in, the rail's 56px hit area needs the sheet's left margin to be
        // at least 80px, which it reaches at ~1063px (102.273vw - 1007.27px, globals.css). 1064 is
        // the narrowest that keeps it off the sheet: any lower and hovering the sheet's edge would
        // light the ticks. What shows sits well inside that margin — the marks end 48px in, 57px
        // with a tick fanned out on hover. Below that, within the sheet band, it steps aside.
        // Repeated in the entrance media query in blog-post-rail-nav.module.css.
        'hidden min-[820px]:flex sheet:hidden min-[1064px]:flex paper:hidden',
        // Vertically centred so the cluster stays reachable at any scroll position without being
        // fixed to an edge. 24px from the viewport edge throughout: over the full-bleed paper
        // below 1024px, and on the grid in the sheet's left margin from 1064px.
        'fixed left-2 min-[820px]:left-6 top-1/2 -translate-y-1/2 z-60',
        'flex-col items-start gap-5'
      )}
      aria-label="Post navigation"
    >
      {/* Home — the third of three Home affordances (sidebar, hamburger, here). All must flag the
          departure as backwards, or this one would slide a fresh sheet in while the others slide
          the current one out. */}
      <Link
        href="/"
        onClick={handleHomeClick}
        aria-label="Back to home"
        className={cn(
          'flex h-8 w-14 items-center rounded-full pl-2',
          // Colour copied from the ≥1200px sidebar Home link so the two read as one control. The
          // glyph carries the hover by itself; no hover background behind it, since a tint under a
          // 16px mark and the mark's own colour change are two signals for one state.
          '!not-italic !no-underline !text-stone-400 dark:!text-zinc-400',
          'hover:!text-rose-700 dark:hover:!text-rose-400',
          'motion-safe:active:scale-[0.97]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/60 dark:focus-visible:ring-rose-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background'
        )}
        style={{
          transition: 'color 300ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* The 56x32 box is hit area, not a drawn shape — the same width the tick rows use, so the
            whole cluster answers to one reach. */}
        <Undo2 className="size-4 flex-shrink-0 -translate-y-px" aria-hidden />
      </Link>

      {/* A continuous 14px row pitch keeps the ticks reading as one dense stroke pattern. Each row
          owns the full pitch and the horizontal space up to its label, maximizing the hit target
          without changing the marks' visual spacing or introducing overlapping targets. */}
      {items.length > 0 && (
        <nav
          aria-label="Table of contents"
          onMouseLeave={handleTitleMouseLeave}
          className={cn(
            styles.rail,
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
                onMouseEnter={handleTitleMouseEnter}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  styles.tickRow,
                  isActive && styles.tickRowActive,
                  // The 56px box expands the hover/click target to the right. CSS centers the
                  // resting tick on the Undo icon's 16px axis, then keeps its left edge anchored so
                  // hover widths expand rightward. The label stays at the former 44px edge. A 14px
                  // height fills the complete row pitch, so neighboring targets remain contiguous.
                  'relative -ml-2 flex h-[14px] w-14 cursor-pointer items-center rounded-sm',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/60 dark:focus-visible:ring-rose-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'motion-safe:active:scale-[0.97]'
                )}
              >
                <span aria-hidden className={cn(styles.tick, isActive && styles.tickActive)} />
                <span
                  className={cn(
                    styles.reveal,
                    'absolute left-11 top-1/2 isolate whitespace-nowrap text-left',
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
