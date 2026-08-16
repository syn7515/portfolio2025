"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { useToc } from '@/components/use-toc'

interface BlogPostTocProps {
  contentSelector?: string
  className?: string
}

/**
 * The sidebar's text table of contents, shown at ≥1280px where the rail has room for full labels.
 * Below that width the same entries are rendered as tick marks by blog-post-rail-nav.
 */
export default function BlogPostToc({ contentSelector, className }: BlogPostTocProps) {
  const { items, activeId, goTo } = useToc(contentSelector)

  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents" className={cn('flex flex-col gap-1', className)}>
      {items.map(({ id, text }) => (
        <button
          key={id}
          type="button"
          onClick={() => goTo(id)}
          className={cn(
            'origin-left cursor-pointer rounded text-left hover:translate-x-[12px] hover:text-orange-700 dark:hover:text-orange-400 motion-safe:active:scale-[0.97]',
            activeId === id
              ? 'text-stone-800 dark:text-zinc-100'
              : 'text-stone-400 dark:text-zinc-400'
          )}
          style={{
            fontFamily: 'var(--font-crimson-pro), serif',
            fontSize: '18px',
            fontWeight: 450,
            letterSpacing: '-0.02em',
            textShadow: 'var(--toc-text-shadow)',
            transition: 'color 200ms ease-out, translate 200ms ease-out, scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {text}
        </button>
      ))}
    </nav>
  )
}
