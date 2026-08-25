"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { prefersReducedMotion } from '@/lib/utils'
import {
  BLOG_POST_MASK_NAV_EVENT,
  clearBlogPostMaskNavigation,
  markBlogPostMaskNavigation,
  type BlogPostMaskDirection,
  type BlogPostMaskNavigationDetail,
} from '@/lib/blog-post-mask-transition'
import styles from './blog-post-transition-mask.module.css'

type MaskPhase = 'idle' | 'preparing' | 'covering' | 'revealing'

const COVER_DURATION_MS = 360
const REVEAL_DURATION_MS = 480

export default function BlogPostTransitionMask() {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<MaskPhase>('idle')
  const [direction, setDirection] = useState<BlogPostMaskDirection>('next')
  const activeRef = useRef(false)
  const hrefRef = useRef<string | null>(null)
  const departurePathRef = useRef<string | null>(null)
  const coverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    const frame = requestAnimationFrame(() => {
      setPhase('revealing')
      revealTimerRef.current = setTimeout(() => {
        setPhase('idle')
        clearBlogPostMaskNavigation()
        activeRef.current = false
        hrefRef.current = null
        departurePathRef.current = null
      }, REVEAL_DURATION_MS)
    })

    return () => cancelAnimationFrame(frame)
  }, [pathname])

  useEffect(() => () => {
    if (coverTimerRef.current) clearTimeout(coverTimerRef.current)
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
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
