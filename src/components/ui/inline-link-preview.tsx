"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OgResponse } from '@/app/api/og/route'

const BELOW_GAP = 12
const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 200
const HOVER_DELAY_MS = 200

export interface InlineLinkPreviewProps {
  href: string
  children: React.ReactNode
  explanation?: string
  imageUrl?: string
  className?: string
  variant?: 'intro-link' | 'intro-link-light'
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

const cache = new Map<string, OgResponse>()

async function fetchOg(url: string): Promise<OgResponse> {
  const cached = cache.get(url)
  if (cached) return cached
  const encoded = encodeURIComponent(url)
  const res = await fetch(`/api/og?url=${encoded}`)
  const data = (await res.json()) as OgResponse
  cache.set(url, data)
  return data
}

export function InlineLinkPreview({
  href,
  children,
  explanation,
  imageUrl: imageUrlProp,
  className,
  variant = 'intro-link',
}: InlineLinkPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [ogData, setOgData] = useState<OgResponse | null>(null)
  const [badgeTextDark, setBadgeTextDark] = useState(true)
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const previewImageUrl = imageUrlProp ?? ogData?.image ?? null
  const hasImage = Boolean(previewImageUrl)

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    try {
      const canvas = document.createElement('canvas')
      canvas.width = PREVIEW_WIDTH
      canvas.height = PREVIEW_HEIGHT
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const imgAspect = img.naturalWidth / img.naturalHeight
      const canvasAspect = PREVIEW_WIDTH / PREVIEW_HEIGHT
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
      if (imgAspect > canvasAspect) {
        sw = img.naturalHeight * canvasAspect
        sx = (img.naturalWidth - sw) / 2
      } else {
        sh = img.naturalWidth / canvasAspect
        sy = (img.naturalHeight - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
      const { data } = ctx.getImageData(8, 8, 80, 24)
      let total = 0
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }
      setBadgeTextDark(total / (data.length / 4) > 128)
    } catch {
      // CORS blocked — keep default
    }
  }, [])

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

  const handleMouseEnter = useCallback(() => {
    anchorRef.current?.style.setProperty('text-decoration-color', 'var(--intro-trigger-decoration-hover)', 'important')
    hoverDelayRef.current = setTimeout(() => {
      setIsHovered(true)
      setAnchorRect(anchorRef.current?.getBoundingClientRect() ?? null)
    }, HOVER_DELAY_MS)
  }, [])

  const handleMouseLeave = useCallback(() => {
    anchorRef.current?.style.setProperty('text-decoration-color', 'var(--intro-trigger-decoration)', 'important')
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current)
      hoverDelayRef.current = null
    }
    setIsHovered(false)
    setAnchorRect(null)
  }, [])

  // Eagerly fetch OG data on mount so the image is ready before hover
  useEffect(() => {
    if (imageUrlProp != null) return
    let cancelled = false
    fetchOg(href).then((data) => {
      if (!cancelled) setOgData(data)
    })
    return () => { cancelled = true }
  }, [href, imageUrlProp])

  // Preload the image into the browser cache as soon as the URL is known
  useEffect(() => {
    if (!previewImageUrl) return
    const img = new window.Image()
    img.src = previewImageUrl
  }, [previewImageUrl])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      window.open(href, '_blank', 'noopener,noreferrer')
    },
    [href]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    },
    [href]
  )

  const boxStyle = React.useMemo(() => {
    if (!anchorRect) return undefined
    const left = anchorRect.left + anchorRect.width / 2 - PREVIEW_WIDTH / 2
    const top = anchorRect.bottom + BELOW_GAP
    const { left: clampedLeft, top: clampedTop } = clampPosition(left, top, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    return { left: clampedLeft, top: clampedTop, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }
  }, [anchorRect])

  const showCard = isHovered && boxStyle && hasImage && typeof document !== 'undefined'

  const previewBox = showCard ? (
    <motion.div
      key="preview"
      className="fixed z-50 overflow-hidden bg-stone-900 dark:bg-zinc-900 pointer-events-none shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),_0_4px_6px_-2px_rgba(0,0,0,0.05),_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3),_0_4px_6px_-2px_rgba(0,0,0,0.2),_0_0_0_1px_rgba(255,255,255,0.06)]"
      style={{
        left: boxStyle!.left,
        top: boxStyle!.top,
        width: boxStyle!.width,
        height: boxStyle!.height,
      }}
      initial={{ opacity: 0, y: -8, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
      transition={{ type: "spring", duration: 0.2, bounce: 0 }}
      aria-hidden
    >
      <div className="relative w-full h-full">
        <img
          ref={imgRef}
          src={previewImageUrl!}
          alt=""
          crossOrigin="anonymous"
          onLoad={handleImageLoad}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span
          className={`absolute top-2 right-2 z-10 rounded-full bg-white/25 backdrop-blur-sm p-2.5 ${badgeTextDark ? 'text-stone-700' : 'text-stone-200'}`}
        >
          <ExternalLink size={14} strokeWidth={2} />
        </span>
        {explanation && (
          <>
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-sm [mask-image:linear-gradient(to_top,black_0%,transparent_85%)]"
              aria-hidden
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[45%] backdrop-blur-md [mask-image:linear-gradient(to_top,black_0%,transparent_75%)]"
              aria-hidden
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[30%] backdrop-blur-xl [mask-image:linear-gradient(to_top,black_0%,transparent_65%)]"
              aria-hidden
            />
            <p
              className="absolute bottom-0 left-0 right-0 pt-3 px-3 pb-0 text-xs font-normal leading-[1.15]"
              style={{ color: 'rgb(231 229 228)' }}
            >
              {explanation}
            </p>
          </>
        )}
      </div>
    </motion.div>
  ) : null

  return (
    <>
      <a
        ref={setAnchorRef}
        data-inline-link-preview-trigger
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={cn(
          variant,
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-1 rounded',
          className
        )}
        aria-label={`Open link: ${href}`}
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

export default InlineLinkPreview
