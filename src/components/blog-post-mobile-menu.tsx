"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, prefersReducedMotion } from '@/lib/utils'
import { PROJECTS } from '@/components/blog-post-layout'
import { markPaperBackNav } from '@/lib/paper-exit-transition'

interface BlogPostMobileMenuProps {
  slug?: string
}

const BAR_CLASS = 'absolute left-[8px] right-[8px] h-[2px] rounded-none bg-stone-500 dark:bg-zinc-400 motion-safe:transition-[translate,rotate,opacity,filter] motion-safe:duration-250 motion-safe:ease-out'

// How long the overlay takes to settle into a solid paper sheet before the route swap happens
const LEAVE_FADE_MS = 300

export default function BlogPostMobileMenu({ slug }: BlogPostMobileMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // Navigation-in-progress: the overlay stays up and fades to opaque paper so the old page is
  // swapped out behind it instead of visibly vanishing, then the new page's own entrance fade
  // picks up from the same paper color.
  const [leaving, setLeaving] = useState(false)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
  }, [])

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
      markPaperBackNav()
      return
    }
    e.preventDefault()
    // Reduced motion: skip the fade-to-paper entirely and navigate at once.
    if (prefersReducedMotion()) {
      router.push(href)
      return
    }
    setLeaving(true)
    leaveTimerRef.current = setTimeout(() => router.push(href), LEAVE_FADE_MS)
  }

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open || leaving) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, leaving])

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
        aria-hidden={!open}
        className={cn(
          'fixed inset-0 z-[65] flex items-center justify-center transition-[opacity,visibility,background-color] duration-250 ease-out',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
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
                    : '!text-stone-500 dark:!text-zinc-400 !no-underline hover:!text-orange-700 dark:hover:!text-orange-200'
                )}
                tabIndex={open ? undefined : -1}
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
        className={cn(
          'fixed inset-x-0 top-0 z-[70] flex h-12 items-center justify-between px-6 pointer-events-none transition-opacity duration-250 ease-out',
          leaving && 'opacity-0 pointer-events-none'
        )}
      >
        <Link
          href="/"
          aria-label="Sue Park — Home"
          aria-hidden={leaving || undefined}
          tabIndex={leaving ? -1 : undefined}
          onClick={(e) => handleLinkClick(e, '/', false)}
          className={cn(
            'pointer-events-auto inline-flex h-9 translate-y-[3px] items-center rounded !text-stone-700 dark:!text-zinc-200 !no-underline motion-safe:active:scale-[0.97]',
            leaving && 'pointer-events-none'
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
          disabled={leaving}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="pointer-events-auto relative -mr-2 size-9 cursor-pointer disabled:pointer-events-none [-webkit-tap-highlight-color:transparent]"
        >
          {/* Top bar: rotates while sliding down to the center, forming the "\" diagonal (pointing top-left) */}
          <span
            aria-hidden
            className={cn(BAR_CLASS, 'top-[10px]', open && 'translate-y-[7px] rotate-45')}
          />
          {/* Middle bar: dissolves with a blur */}
          <span
            aria-hidden
            className={cn(BAR_CLASS, 'top-[17px]', open && 'opacity-0 blur-[3px]')}
          />
          {/* Bottom bar: rotates while sliding up to the center, forming the "/" diagonal */}
          <span
            aria-hidden
            className={cn(BAR_CLASS, 'top-[24px]', open && '-translate-y-[7px] -rotate-45')}
          />
        </button>
      </nav>
    </div>
  )
}
