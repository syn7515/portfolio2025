"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, prefersReducedMotion } from '@/lib/utils'
import { PROJECTS } from '@/components/blog-post-layout'

interface BlogPostMobileMenuProps {
  slug?: string
}

const BAR_CLASS = 'absolute left-[9px] right-[9px] h-[2px] rounded-[2px] bg-stone-500 dark:bg-zinc-400 motion-safe:transition-[translate,rotate,opacity,filter] motion-safe:duration-250 motion-safe:ease-out'

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
    // Home: let the Link navigate immediately with no exit fade, matching the
    // sidebar's back-to-home link in blog-post-layout.
    if (href === '/') return
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

  const items = [
    { href: '/', label: 'Home', slug: undefined as string | undefined },
    ...PROJECTS.map(p => ({ href: `/${p.slug}`, label: p.title, slug: p.slug as string | undefined })),
  ]

  return (
    <div className="min-[640px]:hidden">
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
                    : '!text-stone-500 dark:!text-zinc-400 !no-underline hover:!text-orange-700 dark:hover:!text-lime-200'
                )}
                tabIndex={open ? undefined : -1}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Hamburger / close toggle — stays in the same top-right spot in both states */}
      <button
        type="button"
        onClick={() => { if (!leaving) setOpen(v => !v) }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className={cn(
          'fixed top-4 right-4 z-[70] w-10 h-10 p-2 cursor-pointer [-webkit-tap-highlight-color:transparent] transition-opacity duration-250 ease-out',
          leaving && 'opacity-0 pointer-events-none'
        )}
      >
        {/* Top bar: rotates while sliding down to the center, forming the "\" diagonal (pointing top-left) */}
        <span
          aria-hidden
          className={cn(BAR_CLASS, 'top-[12px]', open && 'translate-y-[7px] rotate-45')}
        />
        {/* Middle bar: dissolves with a blur */}
        <span
          aria-hidden
          className={cn(BAR_CLASS, 'top-[19px]', open && 'opacity-0 blur-[3px]')}
        />
        {/* Bottom bar: rotates while sliding up to the center, forming the "/" diagonal */}
        <span
          aria-hidden
          className={cn(BAR_CLASS, 'top-[26px]', open && '-translate-y-[7px] -rotate-45')}
        />
      </button>
    </div>
  )
}
