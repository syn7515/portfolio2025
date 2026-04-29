"use client"

import React from 'react'
import { cn } from '@/lib/utils'

const CONTENT_SELECTOR = '[data-blog-content]'
const HEADING_SELECTOR = '[data-blog-heading]'

interface TocItem {
  id: string
  text: string
}

interface BlogPostTocProps {
  contentSelector?: string
  className?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const SCROLL_SETTLE_MS = 1000

export default function BlogPostToc({ contentSelector = CONTENT_SELECTOR, className }: BlogPostTocProps) {
  const [items, setItems] = React.useState<TocItem[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const lastClickTimeRef = React.useRef<number>(0)

  React.useEffect(() => {
    let rafId: number

    const extractHeadings = () => {
      const container = document.querySelector(contentSelector)
      if (!container) return

      const headingEls = container.querySelectorAll(HEADING_SELECTOR)
      if (headingEls.length === 0) return

      const list: TocItem[] = []
      headingEls.forEach((el) => {
        const id = el.id || slugify((el.textContent || '').trim())
        if (!el.id) (el as HTMLElement).id = id
        const text = (el.getAttribute('data-toc-label') || el.textContent || '').trim()
        if (text) list.push({ id, text })
      })
      setItems(list)
    }

    const schedule = () => {
      rafId = requestAnimationFrame(extractHeadings)
    }

    schedule()
    const timer = setTimeout(schedule, 300)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafId)
    }
  }, [contentSelector])

  React.useEffect(() => {
    if (items.length === 0) return

    const container = document.querySelector(contentSelector)
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() - lastClickTimeRef.current < SCROLL_SETTLE_MS) return
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.id
          if (id) setActiveId(id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    items.forEach(({ id }) => {
      const el = container.querySelector(`#${CSS.escape(id)}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [contentSelector, items])

  const handleClick = (id: string) => {
    lastClickTimeRef.current = Date.now()
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 54
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents" className={cn('flex flex-col gap-2', className)}>
      {items.map(({ id, text }) => (
        <button
          key={id}
          type="button"
          onClick={() => handleClick(id)}
          className={cn(
            'cursor-pointer text-left text-sm font-normal transition-all duration-200 ease-out hover:translate-x-[12px]',
            activeId === id
              ? 'text-stone-800 dark:text-zinc-100'
              : 'text-stone-400 dark:text-zinc-400'
          )}
          style={{ textShadow: 'var(--toc-text-shadow)' }}
        >
          {text}
        </button>
      ))}
    </nav>
  )
}
