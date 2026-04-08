"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const BELOW_GAP = 12
const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 180
const HOVER_DELAY_MS = 200
const MIN_SHIMMER_MS = 800

interface InlineYoutubePreviewProps {
  videoId: string
  start?: number
  children: React.ReactNode
  className?: string
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

function buildEmbedUrl(videoId: string, start?: number): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
  })
  if (start != null && start > 0) params.set('start', String(start))
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function InlineYoutubePreview({
  videoId,
  start,
  children,
  className,
}: InlineYoutubePreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const hoverStartRef = useRef<number>(0)

  const applyTriggerStyles = useCallback((el: HTMLAnchorElement | null) => {
    if (!el) return
    el.style.setProperty('text-decoration-line', 'underline', 'important')
    el.style.setProperty('text-decoration-style', 'solid', 'important')
    el.style.setProperty('text-decoration-color', 'var(--intro-trigger-decoration)', 'important')
    el.style.setProperty('text-decoration-thickness', '5%', 'important')
    el.style.setProperty('text-underline-offset', '0.05rem', 'important')
    el.style.setProperty('font-style', 'italic', 'important')
  }, [])

  const setAnchorRef = useCallback((el: HTMLAnchorElement | null) => {
    anchorRef.current = el
    applyTriggerStyles(el)
  }, [applyTriggerStyles])

  const watchUrl = buildWatchUrl(videoId, start)
  const embedUrl = buildEmbedUrl(videoId, start)


  const handleMouseEnter = useCallback(() => {
    hoverDelayRef.current = setTimeout(() => {
      hoverStartRef.current = Date.now()
      setIsHovered(true)
      setAnchorRect(anchorRef.current?.getBoundingClientRect() ?? null)
    }, HOVER_DELAY_MS)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current)
      hoverDelayRef.current = null
    }
    setIsHovered(false)
    setIframeReady(false)
    setAnchorRect(null)
  }, [])

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
    if (!anchorRect) return undefined
    const left = anchorRect.left + anchorRect.width / 2 - PREVIEW_WIDTH / 2
    const top = anchorRect.bottom + BELOW_GAP
    const { left: clampedLeft, top: clampedTop } = clampPosition(left, top, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    return { left: clampedLeft, top: clampedTop, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }
  }, [anchorRect])

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
        }}
        initial={{ opacity: 0, y: -8, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
        transition={{ type: "spring", duration: 0.2, bounce: 0 }}
        aria-hidden
      >
        {/* Shimmer skeleton shown while iframe loads */}
        {!iframeReady && (
          <div className="absolute inset-0 bg-stone-800 dark:bg-zinc-800 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        )}
        <iframe
          src={embedUrl}
          title="YouTube preview"
          className="absolute inset-0 w-full h-full border-0 transition-opacity duration-300"
          style={{ opacity: iframeReady ? 1 : 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            const elapsed = Date.now() - hoverStartRef.current
            const remaining = Math.max(0, MIN_SHIMMER_MS - elapsed)
            setTimeout(() => setIframeReady(true), remaining)
          }}
        />
      </motion.div>
    ) : null

  return (
    <>
      <a
        ref={setAnchorRef}
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
