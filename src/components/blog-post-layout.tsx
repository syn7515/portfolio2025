"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUp, Undo2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Divider } from '@/components/ui/divider'
import styles from './blog-post.module.css'
import BlogPostHeader from '@/components/blog-post-header'
import BlogPostToc from '@/components/blog-post-toc'

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
  title: string
  subtitle?: string
}

// Project navigation data
const PROJECTS = [
  {
    slug: 'alphagrill',
    title: 'AlphaGrill',
    description: 'Robot Interface for Collaboration in Kitchen'
  },
  {
    slug: 'aniai',
    title: 'Aniai',
    description: 'Building the Tools Behind Smarter Robots'
  },
  {
    slug: 'athenahealth',
    title: 'AthenaHealth',
    description: 'Encouraging Prompt Medical Bill Payment'
  }
] as const

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

// Paper entrance animation: paper slides in from the top-right corner with a blur-in, then content fades in on top of it
const ENTRANCE_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const PAPER_SLIDE_DURATION = 0.45
const PAPER_OFFSET_X = 40
const PAPER_OFFSET_Y = -32
const PAPER_INITIAL_ROTATE_DEG = 2
const PAPER_BLUR_PX = 10

// Hoisted to stable module-level references (rather than object literals recreated per render) so
// that unrelated re-renders — e.g. the scroll/resize listeners below firing mid-animation — never
// hand Framer Motion a new `animate`/`transition` object reference for the same target. Framer Motion
// can treat a changed reference as a reason to re-evaluate the in-flight tween, which reads as the
// entrance animation being randomly interrupted depending on whether a scroll/resize event happens
// to land during the ~0.45s slide.
const PAPER_OFFSCREEN = { x: PAPER_OFFSET_X, y: PAPER_OFFSET_Y, rotate: PAPER_INITIAL_ROTATE_DEG, filter: `blur(${PAPER_BLUR_PX}px)` }
const PAPER_REST = { x: 0, y: 0, rotate: 0, filter: 'blur(0px)' }
const PAPER_TRANSITION_FULL = { duration: PAPER_SLIDE_DURATION, ease: ENTRANCE_EASE }
const PAPER_TRANSITION_REDUCED = { duration: 0 }
const CONTENT_FADE_TRANSITION = { duration: 0.5, ease: ENTRANCE_EASE }
const CONTENT_FADE_HIDDEN = { opacity: 0 }
const CONTENT_FADE_VISIBLE = { opacity: 1 }

export default function BlogPostLayout({ children, slug, title, subtitle }: BlogPostLayoutProps) {
  const { previousProject, nextProject } = getProjectNavigation(slug)
  const [animationReady, setAnimationReady] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [viewportTall, setViewportTall] = useState(false)
  // Flips once the decorative entrance overlay finishes landing; reveals the real (always-mounted,
  // never-transformed) content underneath it. See the "Real paper" / "Decorative entrance overlay"
  // comments below for why content and the slide animation live on separate elements.
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    setAnimationReady(true)
  }, [])

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

  const shouldReduceMotion = useReducedMotion()
  // Pre-mount state (server + first client paint) never branches on shouldReduceMotion: that hook
  // resolves differently between server (always null) and client first-render, so using it here
  // would cause a hydration mismatch. It only affects the transition below, which applies after
  // animationReady flips post-hydration. The animate target is the same either way now (no more
  // mid-flight keyframe), so only the transition timing needs to branch.
  const paperTransition = shouldReduceMotion ? PAPER_TRANSITION_REDUCED : PAPER_TRANSITION_FULL

  return (
    <TooltipProvider>
      {/* Top-edge fade overlay */}
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: '80px',
          background: 'linear-gradient(to bottom, var(--top-fade-from) 0%, transparent 100%)',
        }}
      />

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
          <Link href="/" className="flex items-center gap-2 w-fit text-sm font-[460] !not-italic !no-underline !text-stone-400 dark:!text-zinc-400 hover:!text-orange-700 dark:hover:!text-lime-200 transition-colors duration-300 ease-out px-3 py-2 -mx-3 -my-2 rounded" aria-label="Back to home">
            <Undo2 className="size-4 flex-shrink-0" />
            Home
          </Link>
          <BlogPostToc />
        </div>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn(
            'absolute bottom-20 min-[1280px]:bottom-[120px] mb-[120px] left-14 flex items-center gap-2 w-fit whitespace-nowrap text-sm font-[460] text-stone-400 dark:text-zinc-400 hover:text-orange-700 dark:hover:text-lime-200 transition-[color,opacity,filter] duration-300 ease-out cursor-pointer pointer-events-auto px-3 py-2 -mx-3 -my-2 rounded',
            showBackToTop && viewportTall
              ? 'opacity-100 blur-none'
              : 'opacity-0 blur-[4px] pointer-events-none'
          )}
          aria-label="Back to top"
        >
          <ArrowUp className="size-4 flex-shrink-0" />
          Back to top
        </button>
      </aside>

      <div className="w-full min-h-screen overflow-x-clip flex flex-col relative">
        {/* Dummy paper: static sheet already in place at the paper's rest position, sitting beneath
            everything else so the entrance reads as a new paper landing on an existing stack rather
            than materializing out of nothing. Once the real paper (same rect, same shadow) lands on
            top of it, it's fully redundant — left at full opacity, its shadow would sit exactly
            underneath the real paper's identical shadow and compound into a darker edge than either
            shadow alone, so it fades out as soon as the real content is revealed. */}
        <div
          aria-hidden
          className="absolute inset-0 min-[1280px]:top-[100px] transition-opacity duration-500 ease-out"
          style={{
            backgroundColor: 'var(--paper-bg)',
            boxShadow: 'var(--paper-box-shadow)',
            marginLeft: 'var(--sidebar-w)',
            opacity: contentVisible ? 0 : 1,
          }}
        />

        {/* Real paper: holds the actual header/content/footer, floats after sidebar at ≥1500px. This
            element is never transformed — a transform/filter (even an identity one like
            translate(0,0)) permanently creates a CSS stacking context, which would trap descendants
            (e.g. the carousel's z-[50]) below page-level fixed overlays like the top-edge fade
            regardless of their own z-index. So the slide-in visual lives on a separate, disposable
            overlay below, and this element just stays hidden (via `visibility`, which does not create
            a stacking context) until that overlay lands. */}
        <div
          className={cn(
            'flex-1 min-[1280px]:mt-[100px] overflow-x-clip relative',
            contentVisible ? 'visible' : 'invisible'
          )}
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
        >
          <motion.div
            className="pt-20 xs:pt-20 min-[640px]:pt-24 min-[1024px]:pt-[7.5rem] min-[1280px]:pt-[8.75rem]"
            initial={CONTENT_FADE_HIDDEN}
            animate={contentVisible ? CONTENT_FADE_VISIBLE : CONTENT_FADE_HIDDEN}
            transition={CONTENT_FADE_TRANSITION}
          >
            <div className="px-6 min-[1280px]:px-0 min-[1280px]:ml-[calc(50vw_-_520px)] min-[1280px]:w-[560px]">
                {/* Header: title, subtitle */}
                <BlogPostHeader slug={slug} title={title} subtitle={subtitle} />

                {/* Content */}
                <div className={cn(styles.mdxContent, 'max-w-[560px] mx-auto')} data-blog-content>
                  {children}
                </div>

                {/* Project Navigation Footer — inside paper */}
                {(previousProject || nextProject) ? (
                  <div className="max-w-[560px] mx-auto min-[1280px]:max-w-none mt-16 min-[1280px]:mt-32 pb-12 min-[640px]:pb-16 min-[1280px]:pb-[120px] overflow-x-hidden">
                    <Divider variant="default" color="stone" spacing="md" />
                    <div className="flex justify-between items-start mt-4 min-[1280px]:mt-12 gap-8">
                      {/* Previous Project */}
                      {previousProject ? (
                        <Link
                          href={`/${previousProject.slug}`}
                          className="flex-1 group cursor-pointer"
                          style={{ textDecoration: 'none' }}
                        >
                          <div className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic mb-1.5 opacity-80 font-sans">
                            <span className="relative inline-flex items-center">
                              <ArrowLeft
                                className="absolute left-0 size-3.5 text-current opacity-0 blur-[1px] motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-out group-hover:opacity-100 group-hover:blur-none group-focus-visible:opacity-100 group-focus-visible:blur-none motion-reduce:opacity-100 motion-reduce:blur-none"
                                aria-hidden
                              />
                              <span className="relative z-10 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:translate-x-4 group-focus-visible:translate-x-4 motion-reduce:translate-x-0">
                                Previous
                              </span>
                            </span>
                          </div>
                          <p
                            className="mt-0 not-italic project-nav-description transition-colors duration-150 group-hover:!text-orange-700 dark:group-hover:!text-lime-200"
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
                        >
                          <div className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic mb-1.5 opacity-80 font-sans">
                            <span className="relative inline-flex items-center justify-end">
                              <ArrowRight
                                className="absolute right-0 size-3.5 text-current opacity-0 blur-[1px] motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-out group-hover:opacity-100 group-hover:blur-none group-focus-visible:opacity-100 group-focus-visible:blur-none motion-reduce:opacity-100 motion-reduce:blur-none"
                                aria-hidden
                              />
                              <span className="relative z-10 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:-translate-x-4 group-focus-visible:-translate-x-4 motion-reduce:translate-x-0">
                                Next
                              </span>
                            </span>
                          </div>
                          <p
                            className="mt-0 not-italic project-nav-description transition-colors duration-150 group-hover:!text-orange-700 dark:group-hover:!text-lime-200"
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
          </motion.div>
        </div>

        {/* Decorative entrance overlay: plays the slide-in-from-top-right-corner-with-a-blur-in visual
            on top of the (currently hidden) real paper above, then reveals it and removes itself once
            settled. Has no real children, so it's safe for this to be a Framer Motion transform target
            — nothing here needs to escape a stacking context. */}
        {!contentVisible && (
          <motion.div
            aria-hidden
            className="absolute inset-0 min-[1280px]:top-[100px] overflow-x-clip pointer-events-none"
            style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
            initial={PAPER_OFFSCREEN}
            animate={animationReady ? PAPER_REST : PAPER_OFFSCREEN}
            transition={paperTransition}
            onAnimationComplete={() => setContentVisible(true)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}