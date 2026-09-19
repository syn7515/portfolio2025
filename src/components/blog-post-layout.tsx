"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn, scrollBehavior } from '@/lib/utils'
import Link from 'next/link'
import { ArrowUp, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import styles from './blog-post.module.css'
import BlogPostHeader from '@/components/blog-post-header'
import BlogPostToc from '@/components/blog-post-toc'
import BlogPostRailNav from '@/components/blog-post-rail-nav'
import PaperGridBackground from '@/components/ui/paper-grid-background'
import Dinkus from '@/components/ui/dinkus'
import { PROJECTS } from '@/lib/projects'
import {
  isBlogPostMaskNavigation,
  requestBlogPostMaskNavigation,
  type BlogPostMaskDirection,
} from '@/lib/blog-post-mask-transition'
import {
  PAPER_EXIT_REST,
  PAPER_EXIT_OFFSCREEN,
  PAPER_EXIT_TRANSITION,
  PAPER_EXIT_TRANSITION_REDUCED,
  PAPER_EXIT_TRANSFORM_ORIGIN,
  markPaperBackNav,
  isPaperBackNav,
  clearPaperBackNav,
  isPageReload,
  clearPageReload,
  shouldSkipPaperPageTransition,
} from '@/lib/paper-exit-transition'

// The last thing the entrance in blog-post.module.css finishes is the underlay retiring — a 500ms
// fade that starts on the sheet's 450ms landing frame. (Content reveal ends earlier, at 700ms.)
// Once that has run, the entrance classes are inert *unless* a media query flips their computed
// animation-name from `none` back to a real name, which is exactly what crossing the 640px
// breakpoint does: the phone block suppresses all of them below that width, so resizing back up
// replayed the whole entrance — the empty sheet slid in again and every content block re-hid.
// Pinning .paperNoEntrance once this elapses makes the entrance run once per page load, full stop.
const ENTRANCE_TOTAL_MS = 950

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
  subtitle?: string
  title: string
}

interface ProjectNavigation {
  previousProject?: {
    slug: string
    title: string
    description: string
  }
  nextProject?: {
    slug: string
    title: string
    description: string
  }
}

function getProjectNavigation(slug?: string): ProjectNavigation {
  if (!slug) return {}
  
  const currentIndex = PROJECTS.findIndex(p => p.slug === slug)
  if (currentIndex === -1) return {}
  
  const previousProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : undefined
  const nextProject = currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : undefined
  
  return {
    previousProject: previousProject ? {
      slug: previousProject.slug,
      title: previousProject.title,
      description: previousProject.description
    } : undefined,
    nextProject: nextProject ? {
      slug: nextProject.slug,
      title: nextProject.title,
      description: nextProject.description
    } : undefined
  }
}

// Helper function to prevent widows by wrapping last two words
function preventWidow(text: string): React.ReactNode {
  const words = text.split(' ')
  if (words.length <= 2) return text
  
  const lastTwoWords = words.slice(-2).join(' ')
  const restOfText = words.slice(0, -2).join(' ')
  
  return (
    <>
      {restOfText && `${restOfText} `}
      <span style={{ whiteSpace: 'nowrap' }}>{lastTwoWords}</span>
    </>
  )
}

// The paper entrance (sheet slides in from the top-right with a blur-in, then content is revealed
// on the landing frame) is defined entirely in blog-post.module.css. It has no dynamic inputs, so
// CSS can run it on the first painted frame instead of waiting for the JS bundle to download and
// hydrate — which is what used to gate this page's First Contentful Paint. See the comment block
// at the top of that stylesheet.
//
// Slide-out (backwards navigation, footer Previous or sidebar Home) is still Framer-driven: it's
// triggered by an interaction, so it's post-hydration by definition and costs nothing at load. Its
// easing/duration/opacity pacing live in src/lib/paper-exit-transition.ts, shared with app/page.tsx
// so both exits feel identical.

function startInterruptibleScrollToTop(): () => void {
  if (scrollBehavior() === 'auto') {
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => {}
  }

  const controller = new AbortController()
  let finished = false
  let fallbackTimer: number

  const cleanUp = () => {
    if (finished) return
    finished = true
    controller.abort()
    window.clearTimeout(fallbackTimer)
  }

  const interrupt = () => {
    if (finished) return
    window.scrollTo({ top: window.scrollY, behavior: 'auto' })
    cleanUp()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) {
      interrupt()
    }
  }

  const listenerOptions = { passive: true, signal: controller.signal }
  window.addEventListener('wheel', interrupt, listenerOptions)
  window.addEventListener('touchmove', interrupt, listenerOptions)
  window.addEventListener('pointerdown', interrupt, listenerOptions)
  window.addEventListener('keydown', handleKeyDown, { signal: controller.signal })
  window.addEventListener('scrollend', cleanUp, { once: true, signal: controller.signal })

  fallbackTimer = window.setTimeout(cleanUp, 2000)
  window.scrollTo({ top: 0, behavior: 'smooth' })

  return interrupt
}

export default function BlogPostLayout({ children, slug, title, subtitle }: BlogPostLayoutProps) {
  const { previousProject, nextProject } = getProjectNavigation(slug)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [viewportTall, setViewportTall] = useState(false)
  // Backwards navigation (footer "Previous" or sidebar "Home"): instead of a new paper sliding in,
  // the current top sheet slides OUT to the top-right, revealing this post's content already sitting
  // on the paper underneath. The CSS half of that branch reads the <html> attribute directly on the
  // first frame; this state only decides whether to mount the departing sheet, which is a
  // post-hydration concern, so reading it in an effect is fine (and keeps SSR output from ever
  // branching on client-only state).
  const [exitEntrance, setExitEntrance] = useState(false)
  const [exitDone, setExitDone] = useState(false)
  const [maskSuppressedSlug, setMaskSuppressedSlug] = useState<string | null>(null)
  // Refresh: the reader is put back where they were, so the entrance sits the load out. Keyed by
  // slug for the same reason maskSuppressedSlug is — this only describes the document's first
  // route, and a later client-side navigation out of it should animate normally.
  const [reloadSuppressedSlug, setReloadSuppressedSlug] = useState<string | null>(null)
  // Keyed by slug for the same reason maskSuppressedSlug is: this component survives client-side
  // navigation between posts, so a bare boolean would carry one post's settled state into the next
  // one and suppress its entrance. On a slug change the comparison below fails on the first render,
  // before the effect has even re-armed the timer.
  const [settledSlug, setSettledSlug] = useState<string | null>(null)
  const cancelBackToTopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isPaperBackNav()) setExitEntrance(true)
    if (isPageReload()) setReloadSuppressedSlug(slug ?? null)
    if (isBlogPostMaskNavigation()) setMaskSuppressedSlug(slug ?? null)
  }, [slug])

  // Release the <html> attribute as soon as the suppression class above it has committed. It has to
  // go before the next forward navigation — otherwise that page's entrance would be suppressed too —
  // but it must not go while it is the *only* thing suppressing this one: clearing it flips every
  // entrance animation's computed name from `none` back to a real name, which is how CSS starts an
  // animation. Doing that at the end of the exit made the empty sheet slide straight back in and
  // re-hid all the content. Keyed on exitEntrance so it runs strictly after that render commits.
  useEffect(() => {
    if (exitEntrance) clearPaperBackNav()
  }, [exitEntrance])

  // Same handoff for the reload attribute, and it matters more here: it is set on <html> by an
  // inline script that only runs on a full document load, so nothing else would ever take it off
  // and the next post reached from this one would inherit the suppression.
  useEffect(() => {
    if (reloadSuppressedSlug !== null) clearPageReload()
  }, [reloadSuppressedSlug])

  // See ENTRANCE_TOTAL_MS: retire the entrance classes once they've played, so a later viewport
  // change across 640px can't re-arm them. A timer rather than an animationend listener because the
  // phone and reduced-motion cases never fire one — there the entrance is `none` from the start and
  // this just settles after the same delay. The class it adds is a visual no-op at this point: both
  // decorative sheets have already animated to the state it pins them at.
  useEffect(() => {
    const id = window.setTimeout(() => setSettledSlug(slug ?? null), ENTRANCE_TOTAL_MS)
    return () => window.clearTimeout(id)
  }, [slug])

  useEffect(() => {
    const update = () => {
      setShowBackToTop(window.scrollY > 300)
      setViewportTall(window.innerHeight > 700)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    return () => cancelBackToTopRef.current?.()
  }, [])

  const handleBackToTop = useCallback(() => {
    cancelBackToTopRef.current?.()
    cancelBackToTopRef.current = startInterruptibleScrollToTop()
  }, [])

  const handleProjectNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    direction: BlogPostMaskDirection
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return

    if (!shouldSkipPaperPageTransition()) {
      if (direction === 'previous') markPaperBackNav()
      return
    }

    event.preventDefault()
    requestBlogPostMaskNavigation(href, direction)
  }

  // Only the exit needs this now — the entrance handles reduced motion in CSS, where the media
  // query resolves at paint time and can't disagree with the server the way this hook can.
  const shouldReduceMotion = useReducedMotion()
  const exitTransition = shouldReduceMotion ? PAPER_EXIT_TRANSITION_REDUCED : PAPER_EXIT_TRANSITION

  return (
    <>
      {/* Top-edge fade overlay */}
      <div
        aria-hidden
        className={cn('fixed top-0 left-0 right-0 z-40 pointer-events-none', styles.mobileTopFade)}
        style={{
          height: '80px',
          background: 'var(--blog-top-fade-gradient, linear-gradient(to bottom, var(--top-fade-from) 0%, transparent 100%))',
        }}
      />

      {/* Compact rail: Home + tick-mark TOC, for the 820–1200px band where the paper is full-bleed
          and there is no gutter for the text sidebar below. */}
      <BlogPostRailNav />

      {/* Fixed side nav: back + TOC; visible only on lg+ */}
      <aside
        className="hidden paper:block fixed left-0 top-0 bottom-0 z-60 pointer-events-none"
        aria-label="Post navigation"
      >
        {/* Background layer at 10% opacity */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, var(--gradient-bg) 25%, var(--gradient-transparent))',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            maskImage: 'linear-gradient(to right, #000 50%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, #000 50%, transparent)',
            opacity: 0.1,
          }}
        />
        <div className="relative flex flex-col gap-6 pt-[240px] pl-14 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-2 w-fit text-sm font-[460] !not-italic !no-underline !text-stone-400 dark:!text-zinc-400 hover:!text-rose-700 dark:hover:!text-rose-400 motion-safe:active:scale-[0.97] px-3 py-2 -mx-3 -my-2 rounded"
            style={{
              transition: 'color 300ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            aria-label="Back to home"
            onClick={markPaperBackNav}
          >
            <Undo2 className="size-4 flex-shrink-0 -translate-y-px" strokeWidth={1.75} />
            Home
          </Link>
          <BlogPostToc className="mt-2" />
        </div>
        <button
          type="button"
          onClick={handleBackToTop}
          className={cn(
            'absolute bottom-20 paper:bottom-[120px] mb-[120px] left-14 flex items-center gap-2 w-fit whitespace-nowrap text-sm font-[460] text-stone-400 dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400 motion-safe:active:scale-[0.97] cursor-pointer pointer-events-auto px-3 py-2 -mx-3 -my-2 rounded',
            showBackToTop && viewportTall
              ? 'opacity-100 blur-none'
              : 'opacity-0 blur-[4px] pointer-events-none'
          )}
          style={{
            transition: 'color 300ms ease-out, opacity 300ms ease-out, filter 300ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
          aria-label="Back to top"
        >
          <ArrowUp className="size-4 flex-shrink-0" strokeWidth={1.75} />
          Back to top
        </button>
      </aside>

      <div
        className={cn(
          'w-full min-h-screen overflow-x-clip flex flex-col relative',
          (exitEntrance ||
            maskSuppressedSlug === slug ||
            reloadSuppressedSlug === slug ||
            settledSlug === (slug ?? null)) &&
            styles.paperNoEntrance,
          maskSuppressedSlug === slug && styles.maskContentEntrance
        )}
      >
        <PaperGridBackground />

        {/* Dummy paper: static sheet already in place at the paper's rest position, sitting beneath
            everything else so the entrance reads as a new paper landing on an existing stack rather
            than materializing out of nothing. Once the real paper (same rect, same shadow) lands on
            top of it, it's fully redundant — left at full opacity, its shadow would sit exactly
            underneath the real paper's identical shadow and compound into a darker edge than either
            shadow alone, so it fades out as soon as the real content is revealed. Its timing is in
            blog-post.module.css (.paperUnderlay), keyed off the same 450ms landing frame. */}
        <div
          aria-hidden
          className={cn('absolute inset-0 paper:top-[100px]', styles.paperUnderlay)}
          style={{
            backgroundColor: 'var(--paper-bg)',
            boxShadow: 'var(--paper-box-shadow)',
            marginLeft: 'var(--sidebar-w)',
          }}
        />

        {/* Real paper: holds the actual header/content/footer, floats after sidebar at ≥1500px. This
            element and its content wrapper are never transformed or faded — transform, filter, and
            opacity below 1 create stacking contexts that would trap descendants (e.g. the carousel's
            z-[50]) below page-level fixed overlays like the top-edge fade regardless of their own
            z-index. The slide-in visual therefore lives on a separate, disposable overlay below,
            which covers this element while it travels.
            This element is never hidden: it and its text are what FCP and LCP are measured on, so
            anything that withheld them until JS ran would be measuring the bundle, not the page.
            paper-grid-bottom composites the drafting grid into this element's own background below
            1200px, where the full-bleed paper leaves PaperGridBackground nothing to peek out of. It
            has to be a background rather than a child layer precisely because this element isn't a
            stacking context — see globals.css. */}
        <div
          className="paper-grid-bottom flex-1 paper:mt-[100px] overflow-x-clip relative"
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
        >
          <div
            className="pt-20 xs:pt-20 min-[640px]:pt-24 min-[1024px]:pt-[7.5rem] paper:pt-[clamp(6.25rem,calc(13.333vw_-_3.75rem),8.75rem)]"
          >
              {/* --paper-center-offset (globals.css) is what keeps this column on the carousel's
                  centre line rather than the viewport's; without it the cards' bleed is lopsided,
                  reaching further past one side of the text than the other. */}
              <div className="px-6 paper:px-0 paper:ml-[calc(50vw_-_280px_-_var(--sidebar-w)_+_var(--paper-center-offset))] paper:w-[560px]">
                {/* Header: title, then client and dates */}
                <div className={styles.contentBlurRevealItem}>
                  <BlogPostHeader title={title} subtitle={subtitle} />
                </div>

                {/* Content */}
                <div
                  className={cn(
                    styles.mdxContent,
                    'max-w-[560px] mx-auto',
                    styles.contentBlurReveal
                  )}
                  data-blog-content
                  data-inline-link-preview-boundary
                >
                  {children}
                </div>

                {/* End-of-content mark closing the article. It belongs to the text, not to the
                    navigation: the gap above it is half the one below, so it reads as the article
                    signing off rather than as a heading for the rows that follow. Sitting outside
                    the block below also means it still renders when there is no previous or next
                    project to show.

                    Shown at every width, unlike the home page's, where the footer follows a short
                    list closely enough to close it on its own. Here the reader has just come off a
                    long article and the mark is what says it has ended. */}
                <Dinkus className={cn('mt-10 paper:mt-14', styles.contentBlurRevealItem)} />

                {/* Project Navigation Footer — inside paper */}
                {(previousProject || nextProject) ? (
                  <div
                    className={cn(
                      // The dinkus above closes the article; this margin is the space between it
                      // and the navigation, and is exactly twice the one above the dinkus at both
                      // widths (40/80 and 56/112) so the mark sits with the text it ends rather
                      // than heading these rows. Paper width still gets the larger pair: below
                      // 1200px the full-bleed paper carries the drafting grid along its bottom edge
                      // (paper-grid-bottom), which helps separate the two, while at paper width
                      // there is nothing but the gap.
                      // Both values are the whole gap: the children's own top margins collapse into
                      // this one, which is why neither row below sets a margin of its own.
                      'max-w-[560px] mx-auto paper:max-w-none mt-20 paper:mt-28 pb-[28px] min-[640px]:pb-16 paper:pb-[120px] overflow-x-visible',
                      styles.contentBlurRevealItem
                    )}
                  >
                    <div className="flex justify-between items-start gap-8">
                      {/* Previous Project */}
                      {previousProject ? (
                        <Link
                          href={`/${previousProject.slug}`}
                          className="flex-1 group cursor-pointer"
                          style={{ textDecoration: 'none' }}
                          onClick={(event) => handleProjectNavigation(
                            event,
                            `/${previousProject.slug}`,
                            'previous'
                          )}
                        >
                          <div className="text-[14px] text-stone-500 dark:text-zinc-400 group-hover:!text-rose-700 group-active:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400 transition-colors duration-150 font-[400] sm:font-normal not-italic mb-0 sm:mb-1.5 opacity-80 font-sans">
                            <span className="relative inline-flex items-center -translate-x-3 sm:translate-x-0">
                              <ChevronLeft
                                className="absolute left-0 size-4 sm:size-3.5 text-stone-400 dark:text-zinc-500 opacity-100 sm:opacity-0 blur-none sm:blur-[1px] motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-out sm:group-hover:opacity-100 sm:group-hover:blur-none sm:group-active:opacity-100 sm:group-active:blur-none sm:group-focus-visible:opacity-100 sm:group-focus-visible:blur-none motion-reduce:opacity-100 motion-reduce:blur-none"
                                aria-hidden
                              />
                              <span className="relative z-10 translate-x-5 sm:translate-x-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out sm:group-hover:translate-x-4 sm:group-active:translate-x-4 sm:group-focus-visible:translate-x-4 sm:motion-reduce:translate-x-4">
                                Previous
                              </span>
                            </span>
                          </div>
                          <p
                            className="hidden sm:block mt-0 not-italic project-nav-description transition-colors duration-150 group-hover:!text-rose-700 group-active:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400"
                            style={{ fontFamily: 'var(--font-crimson-pro), serif', fontSize: '19px', fontWeight: 450, lineHeight: '130%', letterSpacing: '-0.02em', textWrap: 'balance' }}
                          >
                            {preventWidow(previousProject.description)}
                          </p>
                        </Link>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {/* Next Project */}
                      {nextProject ? (
                        <Link
                          href={`/${nextProject.slug}`}
                          className="flex-1 text-right group cursor-pointer"
                          style={{ textDecoration: 'none' }}
                          onClick={(event) => handleProjectNavigation(
                            event,
                            `/${nextProject.slug}`,
                            'next'
                          )}
                        >
                          <div className="text-[14px] text-stone-500 dark:text-zinc-400 group-hover:!text-rose-700 group-active:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400 transition-colors duration-150 font-[400] sm:font-normal not-italic mb-0 sm:mb-1.5 opacity-80 font-sans">
                            <span className="relative inline-flex items-center justify-end translate-x-3 sm:translate-x-0">
                              <ChevronRight
                                className="absolute right-0 size-4 sm:size-3.5 text-stone-400 dark:text-zinc-500 opacity-100 sm:opacity-0 blur-none sm:blur-[1px] motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-out sm:group-hover:opacity-100 sm:group-hover:blur-none sm:group-active:opacity-100 sm:group-active:blur-none sm:group-focus-visible:opacity-100 sm:group-focus-visible:blur-none motion-reduce:opacity-100 motion-reduce:blur-none"
                                aria-hidden
                              />
                              <span className="relative z-10 -translate-x-5 sm:translate-x-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out sm:group-hover:-translate-x-4 sm:group-active:-translate-x-4 sm:group-focus-visible:-translate-x-4 sm:motion-reduce:-translate-x-4">
                                Next
                              </span>
                            </span>
                          </div>
                          <p
                            className="hidden sm:block mt-0 not-italic project-nav-description transition-colors duration-150 group-hover:!text-rose-700 group-active:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400"
                            style={{ fontFamily: 'var(--font-crimson-pro), serif', fontSize: '19px', fontWeight: 450, lineHeight: '130%', letterSpacing: '-0.02em', textWrap: 'balance' }}
                          >
                            {preventWidow(nextProject.description)}
                          </p>
                        </Link>
                      ) : (
                        <div className="flex-1" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pb-12 paper:pb-[148px]" aria-hidden />
                )}
              </div>
          </div>
        </div>

        {/* Decorative entrance overlay: plays the slide-in-from-top-right-corner-with-a-blur-in visual
            on top of the real paper above, covering it while it travels, then retires itself on the
            landing frame. Has no real children, so it's safe for this to be a transform target —
            nothing here needs to escape a stacking context.
            Server-rendered unconditionally and animated purely by .paperEntranceOverlay, so the
            sheet is already moving on the first painted frame. That stylesheet also owns the two
            cases where the entrance shouldn't play at all (reduced motion, backwards navigation) —
            both are things CSS can answer at paint time and React can't. */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 paper:top-[100px] overflow-x-clip pointer-events-none',
            styles.paperEntranceOverlay
          )}
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
        />

        {/* Departing-sheet overlay (backwards navigation): the inverse of the entrance above. The
            content is already revealed underneath (instant-reveal in the mount effect), and this
            sheet starts at the paper's rest position and slides out to the top-right. Needs an
            explicit z-index: the content below is visible during the exit, and carousel children
            use z-[50] at the root stacking level (the real paper deliberately isn't a stacking
            context), so without one the carousel would paint above the departing sheet. z-[55]
            stays below the sidebar (z-60). */}
        {exitEntrance && !exitDone && (
          <motion.div
            aria-hidden
            className="absolute inset-0 paper:top-[100px] overflow-x-clip pointer-events-none z-[55]"
            style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)', transformOrigin: PAPER_EXIT_TRANSFORM_ORIGIN }}
            initial={PAPER_EXIT_REST}
            animate={PAPER_EXIT_OFFSCREEN}
            transition={exitTransition}
            onAnimationComplete={() => setExitDone(true)}
          />
        )}
      </div>
    </>
  )
}
