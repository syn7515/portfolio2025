"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn, prefersReducedMotion } from '@/lib/utils'
import { PROJECTS } from '@/lib/projects'
import { markPaperBackNav } from '@/lib/paper-exit-transition'

const BAR_CLASS = 'absolute left-[8px] right-[8px] h-[2px] rounded-none bg-stone-500 dark:bg-zinc-400 motion-safe:transition-[translate,rotate,opacity,filter] motion-safe:duration-250 motion-safe:ease-out'

// How long the overlay takes to settle into a solid paper sheet before the route swap happens
const LEAVE_FADE_MS = 300
const OVERLAY_REVEAL_MS = 250

export default function BlogPostMobileMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const slug = pathname.split('/').filter(Boolean)[0]
  const isProjectRoute = PROJECTS.some(project => project.slug === slug)
  const [open, setOpen] = useState(false)
  const menuOpen = open && isProjectRoute
  // Navigation-in-progress: the overlay stays up and fades to opaque paper so the old page is
  // swapped out behind it instead of visibly vanishing, then the new page's own entrance fade
  // picks up from the same paper color.
  const [leaving, setLeaving] = useState(false)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const departurePathRef = useRef<string | null>(null)

  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
  }, [])

  // Keep the solid overlay in place until Next has committed the destination route. Only then
  // reveal the new page beneath it; the top navbar lives outside this layer and never unmounts.
  useEffect(() => {
    if (!leaving || !departurePathRef.current || pathname === departurePathRef.current) return

    const frame = requestAnimationFrame(() => {
      setOpen(false)
      revealTimerRef.current = setTimeout(() => {
        setLeaving(false)
        departurePathRef.current = null
      }, OVERLAY_REVEAL_MS)
    })

    return () => cancelAnimationFrame(frame)
  }, [leaving, pathname])

  const handleLinkClick = (e: React.MouseEvent, href: string, isCurrent: boolean) => {
    if (leaving) {
      e.preventDefault()
      return
    }
    if (isCurrent) {
      e.preventDefault()
      setOpen(false)
      return
    }
    // The logo navigates home immediately with no exit fade, matching the sidebar's back-to-home
    // link in blog-post-layout — including flagging the departure as backwards, so home lands with
    // its content already settled and a sheet sliding off it.
    if (href === '/') {
      setOpen(false)
      markPaperBackNav()
      return
    }
    e.preventDefault()
    // Reduced motion: skip the fade-to-paper entirely and navigate at once.
    if (prefersReducedMotion()) {
      setOpen(false)
      router.push(href)
      return
    }
    departurePathRef.current = pathname
    setLeaving(true)
    leaveTimerRef.current = setTimeout(() => router.push(href), LEAVE_FADE_MS)
  }

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  // Close on Escape
  useEffect(() => {
    if (!menuOpen || leaving) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, leaving])

  const items = PROJECTS.map(p => ({
    href: `/${p.slug}`,
    label: p.title,
    slug: p.slug as string | undefined,
  }))

  return (
    <div className="min-[820px]:hidden">
      {/* Blurred full-viewport overlay */}
      <div
        id="mobile-menu"
        aria-hidden={!menuOpen}
        className={cn(
          'fixed inset-0 z-[65] flex items-center justify-center transition-[opacity,visibility,background-color] duration-250 ease-out motion-reduce:transition-none',
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
        style={{
          backgroundColor: leaving
            ? 'var(--paper-bg)'
            : 'color-mix(in srgb, var(--paper-bg) 80%, transparent)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <nav
          aria-label="Mobile"
          className={cn(
            'flex flex-col items-center gap-5 text-center transition-[opacity,filter] duration-250 ease-out',
            leaving && 'opacity-0 blur-[3px] pointer-events-none'
          )}
        >
          {items.map(item => {
            const isCurrent = item.slug !== undefined && item.slug === slug
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href, isCurrent)}
                aria-current={isCurrent ? 'page' : undefined}
                data-mobile-menu-current={isCurrent ? '' : undefined}
                className={cn(
                  'text-[20px] font-[460] tracking-[-0.01em] !not-italic transition-colors duration-300 ease-out px-3 py-1 rounded',
                  isCurrent
                    ? '!text-stone-700 dark:!text-zinc-200'
                    : '!text-stone-500 dark:!text-zinc-400 !no-underline hover:!text-orange-700 active:!text-orange-700 dark:hover:!text-orange-200 dark:active:!text-orange-200'
                )}
                tabIndex={menuOpen ? undefined : -1}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Persistent mobile top navigation: home logo on the left, menu toggle on the right. */}
      <nav
        aria-label="Primary"
        aria-hidden={!isProjectRoute}
        className={cn(
          'fixed inset-x-0 top-0 z-[70] flex h-12 transform-gpu items-center justify-between px-6 pointer-events-none motion-safe:transition-transform motion-safe:duration-[400ms] motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
          isProjectRoute ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <Link
          href="/"
          aria-label="Sue Park — Home"
          tabIndex={!isProjectRoute || leaving ? -1 : undefined}
          onClick={(e) => handleLinkClick(e, '/', false)}
          className={cn(
            'inline-flex h-9 translate-y-[3px] items-center rounded !text-stone-700 dark:!text-zinc-200 !no-underline motion-safe:active:scale-[0.97]',
            isProjectRoute && !leaving ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          style={{
            fontFamily: 'var(--font-biro-script), "Segoe Print", "Bradley Hand", cursive',
            fontSize: '28px',
            lineHeight: '120%',
            letterSpacing: '-0.03em',
            fontWeight: 360,
            transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          Sue Park
        </Link>

        <button
          type="button"
          onClick={() => { if (!leaving) setOpen(v => !v) }}
          disabled={!isProjectRoute || leaving}
          aria-label={menuOpen && !leaving ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen && !leaving}
          aria-controls="mobile-menu"
          className="pointer-events-auto relative -mr-2 size-9 cursor-pointer disabled:pointer-events-none [-webkit-tap-highlight-color:transparent]"
        >
          {/* Top bar: rotates while sliding down to the center, forming the "\" diagonal (pointing top-left) */}
          <span
            aria-hidden
            className={cn(BAR_CLASS, 'top-[10px]', menuOpen && !leaving && 'translate-y-[7px] rotate-45')}
          />
          {/* Middle bar: dissolves with a blur */}
          <span
            aria-hidden
            className={cn(BAR_CLASS, 'top-[17px]', menuOpen && !leaving && 'opacity-0 blur-[3px]')}
          />
          {/* Bottom bar: rotates while sliding up to the center, forming the "/" diagonal */}
          <span
            aria-hidden
            className={cn(BAR_CLASS, 'top-[24px]', menuOpen && !leaving && '-translate-y-[7px] -rotate-45')}
          />
        </button>
      </nav>
    </div>
  )
}
