"use client"

import { useEffect, useRef } from 'react'
import { DEPTH_BUCKETS, trackCaseStudyDepth, type DepthBucket } from '@/lib/analytics'

// Reads how far down the document the reader has been, and reports each quarter once.
//
// Measured against the *scrollable* height rather than the document's full height: on a page
// shorter than the viewport there is nothing to scroll, and dividing by the document height would
// report a permanent 0% for a study the reader can see all of in one screen. When that happens the
// page counts as fully read on arrival, which is what actually occurred.
//
// Sampling is tied to requestAnimationFrame rather than running on every scroll event: the handler
// touches scrollHeight and innerHeight, both of which force layout, and a fast flick fires scroll
// far more often than the page paints.
export default function useScrollDepth(slug?: string) {
  // The set of buckets already sent, kept in a ref so re-renders — of which a case study has many,
  // between the TOC's active section and the entrance state — never resend one.
  const sent = useRef<Set<DepthBucket>>(new Set())

  useEffect(() => {
    if (!slug) return

    sent.current = new Set()
    let frame = 0

    const measure = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100

      for (const bucket of DEPTH_BUCKETS) {
        if (percent + 0.5 >= bucket && !sent.current.has(bucket)) {
          sent.current.add(bucket)
          trackCaseStudyDepth(slug, bucket)
        }
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    // One reading on arrival, which is what records a study short enough to need no scrolling, and
    // what catches the restored scroll position after a reload (see the pre-paint script in
    // layout.tsx). Deferred a frame so it runs after that restore, not before it.
    frame = requestAnimationFrame(measure)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [slug])
}
