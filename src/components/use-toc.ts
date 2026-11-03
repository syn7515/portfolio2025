"use client"

import React from 'react'
import { startInterruptibleScroll } from '@/lib/interruptible-scroll'

const CONTENT_SELECTOR = '[data-blog-content]'
const HEADING_SELECTOR = '[data-blog-heading]'

// The band a heading has to be in to take the highlight: from 80px under the top of the viewport
// to 40% of the way down it.
const BAND_TOP_PX = 80
const BAND_BOTTOM_PCT = 40

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
 * Shared by the sidebar list (1200–1362.5px, ≥1520px) and the compact rail (820–1200px,
 * 1362.5–1520px) so both render the same entries and agree on the active one. Both are mounted at
 * every width — only one is ever displayed — so this deliberately stays cheap: one observer per
 * instance over a handful of headings.
 */
export function useToc(contentSelector: string = CONTENT_SELECTOR) {
  const [items, setItems] = React.useState<TocItem[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  // Clicking a TOC entry scrolls smoothly, which fires a burst of intersection changes on the way
  // past every heading in between. They are ignored for as long as the scroll runs, so the highlight
  // stays on the entry that was actually clicked instead of flickering through the ones being
  // scrolled over.
  const jumpingRef = React.useRef(false)
  const cancelJumpRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    const extractHeadings = () => {
      const container = document.querySelector(contentSelector)
      if (!container) return false

      const headingEls = container.querySelectorAll(HEADING_SELECTOR)
      if (headingEls.length === 0) return false

      const list: TocItem[] = []
      headingEls.forEach((el) => {
        const id = el.id || slugify((el.textContent || '').trim())
        if (!el.id) (el as HTMLElement).id = id
        const text = (el.getAttribute('data-toc-label') || el.textContent || '').trim()
        if (text) list.push({ id, text })
      })
      setItems(list)
      return true
    }

    // Read the DOM directly rather than from inside requestAnimationFrame. The headings are
    // server-rendered, so the commit that mounted this hook has already put them in the document —
    // a frame's wait bought nothing and quietly tied the outline to the page being painted. rAF
    // callbacks are suspended while visibilityState is 'hidden', so a post opened in a background
    // tab built no outline at all until that tab was first brought forward.
    // The retry is insurance for MDX that is somehow still mounting; once headings are found there
    // is nothing left to wait for, and posts with no headings at all (athenahealth) stop after it.
    const found = extractHeadings()
    const timer = found ? undefined : window.setTimeout(extractHeadings, 300)

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [contentSelector])

  React.useEffect(() => {
    if (items.length === 0) return

    const container = document.querySelector(contentSelector)
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (jumpingRef.current) return

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
      { rootMargin: `-${BAND_TOP_PX}px 0px -${100 - BAND_BOTTOM_PCT}% 0px`, threshold: 0 }
    )

    items.forEach(({ id }) => {
      const el = container.querySelector(`#${CSS.escape(id)}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [contentSelector, items])

  React.useEffect(() => {
    return () => cancelJumpRef.current?.()
  }, [])

  const goTo = React.useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (!el) return
      // A click on another entry mid-jump: its pointerdown has already stopped this one, so this
      // only covers a keyboard press.
      cancelJumpRef.current?.()
      jumpingRef.current = true
      setActiveId(id)
      // The heading lands 54px down, or 6px under the top navbar where that is taller: below
      // 1024px it grows from 48px to 64px (blog-post-mobile-menu.tsx), and a fixed 54px would tuck
      // the heading under it. From 1024px the bar is display: none and measures 0.
      const navbarBottom =
        document.querySelector('[data-top-navbar]')?.getBoundingClientRect().bottom ?? 0
      const top = el.getBoundingClientRect().top + window.scrollY - Math.max(54, navbarBottom + 6)
      cancelJumpRef.current = startInterruptibleScroll(top, (interrupted) => {
        jumpingRef.current = false
        cancelJumpRef.current = null
        // Stopped short, the clicked heading may be nowhere near the band, and the observer only
        // speaks up when one crosses it: the highlight goes to the last heading above the band's
        // bottom edge, or to none while the first is still below it.
        if (interrupted) {
          const bandBottom = (window.innerHeight * BAND_BOTTOM_PCT) / 100
          let current: string | null = null
          for (const item of items) {
            const heading = document.getElementById(item.id)
            if (!heading || heading.getBoundingClientRect().top >= bandBottom) break
            current = item.id
          }
          setActiveId(current)
        }
      })
    },
    [items]
  )

  return { items, activeId, goTo }
}
