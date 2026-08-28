"use client"

import React from 'react'
import { scrollBehavior } from '@/lib/utils'

const CONTENT_SELECTOR = '[data-blog-content]'
const HEADING_SELECTOR = '[data-blog-heading]'

// Clicking a TOC entry scrolls smoothly, which fires a burst of intersection changes on the way
// past every heading in between. Ignoring them for this long keeps the highlight on the entry that
// was actually clicked instead of flickering through the ones being scrolled over.
const SCROLL_SETTLE_MS = 1000

export interface TocItem {
  id: string
  text: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Reads the post's headings out of the rendered DOM and tracks which one is currently in view.
 *
 * Shared by the sidebar list (≥1280px) and the compact rail (820–1280px) so both render the same
 * entries and agree on the active one. Both are mounted at every width — only one is ever displayed
 * — so this deliberately stays cheap: one observer per instance over a handful of headings.
 */
export function useToc(contentSelector: string = CONTENT_SELECTOR) {
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

    // Once immediately, once after the entrance has settled — MDX content can still be mounting on
    // the first pass.
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

        const firstId = items[0]?.id
        const firstEntry = entries.find((entry) => entry.target.id === firstId)
        if (
          firstEntry &&
          !firstEntry.isIntersecting &&
          firstEntry.boundingClientRect.top >=
            (firstEntry.rootBounds?.bottom ?? window.innerHeight * 0.4)
        ) {
          setActiveId(null)
          return
        }

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

  const goTo = React.useCallback((id: string) => {
    lastClickTimeRef.current = Date.now()
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 54
      window.scrollTo({ top, behavior: scrollBehavior() })
    }
  }, [])

  return { items, activeId, goTo }
}
