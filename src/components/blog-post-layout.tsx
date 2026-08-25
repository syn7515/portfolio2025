"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn, scrollBehavior } from '@/lib/utils'
import Link from 'next/link'
import { ArrowUp, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Divider } from '@/components/ui/divider'
import styles from './blog-post.module.css'
import BlogPostHeader from '@/components/blog-post-header'
import BlogPostToc from '@/components/blog-post-toc'
import BlogPostRailNav from '@/components/blog-post-rail-nav'
import PaperGridBackground from '@/components/ui/paper-grid-background'
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
  markPaperBackNav,
  isPaperBackNav,
  clearPaperBackNav,
} from '@/lib/paper-exit-transition'

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
  title: string
  subtitle?: string
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
  const cancelBackToTopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isPaperBackNav()) setExitEntrance(true)
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
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: '80px',
          background: 'linear-gradient(to bottom, var(--top-fade-from) 0%, transparent 100%)',
        }}
      />

      {/* Compact rail: Home + tick-mark TOC, for the 820–1280px band where the paper is full-bleed
          and there is no gutter for the text sidebar below. */}
      <BlogPostRailNav />

      {/* Fixed side nav: back + TOC; visible only on lg+ */}
      <aside
        className="hidden min-[1280px]:block fixed left-0 top-0 bottom-0 z-60 pointer-events-none"
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
            className="flex items-center gap-2 w-fit text-sm font-[460] !not-italic !no-underline !text-stone-400 dark:!text-zinc-400 hover:!text-orange-700 dark:hover:!text-orange-400 motion-safe:active:scale-[0.97] px-3 py-2 -mx-3 -my-2 rounded"
            style={{
              transition: 'color 300ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            aria-label="Back to home"
            onClick={markPaperBackNav}
          >
            <Undo2 className="size-4 flex-shrink-0 -translate-y-px" />
            Home
          </Link>
          <BlogPostToc />
        </div>
        <button
          type="button"
          onClick={handleBackToTop}
          className={cn(
            'absolute bottom-20 min-[1280px]:bottom-[120px] mb-[120px] left-14 flex items-center gap-2 w-fit whitespace-nowrap text-sm font-[460] text-stone-400 dark:text-zinc-400 hover:text-orange-700 dark:hover:text-orange-400 motion-safe:active:scale-[0.97] cursor-pointer pointer-events-auto px-3 py-2 -mx-3 -my-2 rounded',
            showBackToTop && viewportTall
              ? 'opacity-100 blur-none'
              : 'opacity-0 blur-[4px] pointer-events-none'
          )}
          style={{
            transition: 'color 300ms ease-out, opacity 300ms ease-out, filter 300ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
          aria-label="Back to top"
        >
          <ArrowUp className="size-4 flex-shrink-0" />
          Back to top
        </button>
      </aside>

      <div
        className={cn(
          'w-full min-h-screen overflow-x-clip flex flex-col relative',
          (exitEntrance || maskSuppressedSlug === slug) && styles.paperNoEntrance
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
          className={cn('absolute inset-0 min-[1280px]:top-[100px]', styles.paperUnderlay)}
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
            anything that withheld them until JS ran would be measuring the bundle, not the page. */}
        <div
          className="flex-1 min-[1280px]:mt-[100px] overflow-x-clip relative"
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
        >
          <div
            className="pt-20 xs:pt-20 min-[640px]:pt-24 min-[1024px]:pt-[7.5rem] min-[1280px]:pt-[clamp(6.25rem,calc(18.182vw_-_8.295rem),8.75rem)]"
          >
              <div className="px-6 min-[1280px]:px-0 min-[1280px]:ml-[calc(50vw_-_280px_-_var(--sidebar-w))] min-[1280px]:w-[560px]">
                {/* Header: title, subtitle */}
                <div className={styles.contentBlurRevealItem}>
                  <BlogPostHeader slug={slug} title={title} subtitle={subtitle} />
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

                {/* Project Navigation Footer — inside paper */}
                {(previousProject || nextProject) ? (
                  <div
                    className={cn(
                      'max-w-[560px] mx-auto min-[1280px]:max-w-none mt-24 min-[640px]:mt-16 min-[1280px]:mt-32 pb-[28px] min-[640px]:pb-16 min-[1280px]:pb-[120px] overflow-x-visible',
                      styles.contentBlurRevealItem
                    )}
                  >
                    <Divider
                      variant="default"
                      color="stone"
                      spacing="md"
                      className="hidden sm:block sm:w-full sm:mx-0"
                    />
                    <div className="flex justify-between items-start mt-4 min-[1280px]:mt-12 gap-8">
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
                          <div className="text-[16px] sm:text-[14px] text-stone-500 dark:text-zinc-400 group-hover:!text-orange-700 group-active:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400 transition-colors duration-150 font-[420] sm:font-normal not-italic mb-0 sm:mb-1.5 opacity-80 font-sans">
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
                            className="hidden sm:block mt-0 not-italic project-nav-description transition-colors duration-150 group-hover:!text-orange-700 group-active:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400"
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
                          <div className="text-[16px] sm:text-[14px] text-stone-500 dark:text-zinc-400 group-hover:!text-orange-700 group-active:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400 transition-colors duration-150 font-[420] sm:font-normal not-italic mb-0 sm:mb-1.5 opacity-80 font-sans">
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
                            className="hidden sm:block mt-0 not-italic project-nav-description transition-colors duration-150 group-hover:!text-orange-700 group-active:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400"
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
                  <div className="pb-12 min-[1280px]:pb-[148px]" aria-hidden />
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
            'absolute inset-0 min-[1280px]:top-[100px] overflow-x-clip pointer-events-none',
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
            className="absolute inset-0 min-[1280px]:top-[100px] overflow-x-clip pointer-events-none z-[55]"
            style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
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
