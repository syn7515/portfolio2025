"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { prefersReducedMotion } from '@/lib/utils'
import {
  BLOG_POST_MASK_NAV_EVENT,
  clearBlogPostMaskEntrance,
  clearBlogPostMaskNavigation,
  markBlogPostMaskEntrance,
  markBlogPostMaskNavigation,
  type BlogPostMaskDirection,
  type BlogPostMaskNavigationDetail,
} from '@/lib/blog-post-mask-transition'
import styles from './blog-post-transition-mask.module.css'

type MaskPhase = 'idle' | 'preparing' | 'covering'

const COVER_DURATION_MS = 360
const CONTENT_ENTER_DELAY_MS = 60
const CONTENT_ENTER_DURATION_MS = 350

export default function BlogPostTransitionMask() {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<MaskPhase>('idle')
  const [direction, setDirection] = useState<BlogPostMaskDirection>('next')
  const activeRef = useRef(false)
  const hrefRef = useRef<string | null>(null)
  const departurePathRef = useRef<string | null>(null)
  const coverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentEnterDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentEnterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      if (activeRef.current) return

      const { href, direction: nextDirection } = (
        event as CustomEvent<BlogPostMaskNavigationDetail>
      ).detail

      if (prefersReducedMotion()) {
        router.push(href)
        return
      }

      activeRef.current = true
      hrefRef.current = href
      departurePathRef.current = pathname
      markBlogPostMaskNavigation()
      setDirection(nextDirection)
      setPhase('preparing')
    }

    window.addEventListener(BLOG_POST_MASK_NAV_EVENT, handleNavigation)
    return () => window.removeEventListener(BLOG_POST_MASK_NAV_EVENT, handleNavigation)
  }, [pathname, router])

  useEffect(() => {
    if (phase !== 'preparing') return
    const frame = requestAnimationFrame(() => setPhase('covering'))
    return () => cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    if (phase !== 'covering' || !hrefRef.current) return

    coverTimerRef.current = setTimeout(() => {
      router.push(hrefRef.current!)
    }, COVER_DURATION_MS)

    return () => {
      if (coverTimerRef.current) clearTimeout(coverTimerRef.current)
    }
  }, [phase, router])

  useEffect(() => {
    if (
      !activeRef.current ||
      !departurePathRef.current ||
      pathname === departurePathRef.current
    ) return

    let frame: number | null = null
    contentEnterDelayTimerRef.current = setTimeout(() => {
      frame = requestAnimationFrame(() => {
        markBlogPostMaskEntrance()
        setPhase('idle')
        clearBlogPostMaskNavigation()
        contentEnterTimerRef.current = setTimeout(() => {
          clearBlogPostMaskEntrance()
          activeRef.current = false
          hrefRef.current = null
          departurePathRef.current = null
        }, CONTENT_ENTER_DURATION_MS)
      })
    }, CONTENT_ENTER_DELAY_MS)

    return () => {
      if (contentEnterDelayTimerRef.current) clearTimeout(contentEnterDelayTimerRef.current)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [pathname])

  useEffect(() => () => {
    if (coverTimerRef.current) clearTimeout(coverTimerRef.current)
    if (contentEnterDelayTimerRef.current) clearTimeout(contentEnterDelayTimerRef.current)
    if (contentEnterTimerRef.current) clearTimeout(contentEnterTimerRef.current)
    clearBlogPostMaskEntrance()
    clearBlogPostMaskNavigation()
  }, [])

  return (
    <div
      aria-hidden
      className={styles.mask}
      data-direction={direction}
      data-phase={phase}
    />
  )
}
