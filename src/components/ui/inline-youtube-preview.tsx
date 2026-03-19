"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const CURSOR_OFFSET = 12
const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 180
const HOVER_DELAY_MS = 200

interface InlineYoutubePreviewProps {
  videoId: string
  start?: number
  children: React.ReactNode
  className?: string
}

function buildEmbedUrl(videoId: string, start?: number): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0', // hide video control bar
    modestbranding: '1', // minimize YouTube logo
    rel: '0', // related videos from same channel only
    iv_load_policy: '3', // hide annotations
    disablekb: '1', // disable keyboard controls in embed
    fs: '0', // hide fullscreen button
  })
  if (start != null && start > 0) params.set('start', String(start))
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

function buildWatchUrl(videoId: string, start?: number): string {
  const base = `https://www.youtube.com/watch?v=${videoId}`
  if (start != null && start > 0) return `${base}&t=${start}`
  return base
}

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { left: number; top: number } {
  const maxLeft = typeof window !== 'undefined' ? window.innerWidth - width : 0
  const maxTop = typeof window !== 'undefined' ? window.innerHeight - height : 0
  return {
    left: Math.max(0, Math.min(x, maxLeft)),
    top: Math.max(0, Math.min(y, maxTop)),
  }
}

export function InlineYoutubePreview({
  videoId,
  start,
  children,
  className,
}: InlineYoutubePreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyTriggerStyles = useCallback((el: HTMLAnchorElement | null) => {
    if (!el) return
    el.style.setProperty('text-decoration-line', 'underline', 'important')
    el.style.setProperty('text-decoration-style', 'solid', 'important')
    el.style.setProperty('text-decoration-color', 'var(--intro-trigger-decoration)', 'important')
    el.style.setProperty('text-decoration-thickness', '5%', 'important')
    el.style.setProperty('text-underline-offset', '0.05rem', 'important')
    el.style.setProperty('font-style', 'italic', 'important')
  }, [])

  const watchUrl = buildWatchUrl(videoId, start)
  const embedUrl = buildEmbedUrl(videoId, start)

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    hoverDelayRef.current = setTimeout(() => {
      setIsHovered(true)
      setPos({ x: e.clientX, y: e.clientY })
    }, HOVER_DELAY_MS)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current)
      hoverDelayRef.current = null
    }
    setIsHovered(false)
    setPos(null)
  }, [])

  // Update position when hovered (mouse might move while over trigger)
  useEffect(() => {
    if (!isHovered) return
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [isHovered])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      window.open(watchUrl, '_blank', 'noopener,noreferrer')
    },
    [watchUrl]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        window.open(watchUrl, '_blank', 'noopener,noreferrer')
      }
    },
    [watchUrl]
  )

  const boxStyle = React.useMemo(() => {
    if (!pos) return undefined
    const { left, top } = clampPosition(
      pos.x + CURSOR_OFFSET,
      pos.y + CURSOR_OFFSET,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT
    )
    return { left, top, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }
  }, [pos])

  const previewBox =
    isHovered && boxStyle && typeof document !== 'undefined' ? (
      <motion.div
        key="preview"
        className="fixed z-50 overflow-hidden bg-stone-900 dark:bg-zinc-900 shadow-lg pointer-events-none"
        style={{
          left: boxStyle.left,
          top: boxStyle.top,
          width: boxStyle.width,
          height: boxStyle.height,
          transformOrigin: 'top left',
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        aria-hidden
      >
        <iframe
          src={embedUrl}
          title="YouTube preview"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    ) : null

  return (
    <>
      <a
        ref={applyTriggerStyles}
        data-inline-youtube-trigger
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={cn(
          'intro-link inline-youtube-preview-trigger focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-1 rounded',
          className
        )}
        aria-label={`Play video: ${watchUrl}`}
      >
        {children}
      </a>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>{previewBox}</AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default InlineYoutubePreview
