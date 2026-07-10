"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PROJECTS } from '@/components/blog-post-layout'

interface BlogPostMobileMenuProps {
  slug?: string
}

const BAR_CLASS = 'absolute left-[9px] right-[9px] h-[2px] rounded-[2px] bg-stone-500 dark:bg-zinc-400 motion-safe:transition-[translate,rotate,opacity,filter] motion-safe:duration-250 motion-safe:ease-out'

export default function BlogPostMobileMenu({ slug }: BlogPostMobileMenuProps) {
  const [open, setOpen] = useState(false)

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
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

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
          'fixed inset-0 z-[65] flex items-center justify-center transition-[opacity,visibility] duration-250 ease-out',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
        style={{
          background: 'color-mix(in srgb, var(--paper-bg) 80%, transparent)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <nav aria-label="Mobile" className="flex flex-col items-center gap-5 text-center">
          {items.map(item => {
            const isCurrent = item.slug !== undefined && item.slug === slug
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="fixed top-4 right-4 z-[70] w-10 h-10 p-2 cursor-pointer [-webkit-tap-highlight-color:transparent]"
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
