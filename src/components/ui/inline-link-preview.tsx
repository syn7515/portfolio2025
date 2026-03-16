"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { OgResponse } from '@/app/api/og/route'

const CURSOR_OFFSET = 12
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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [ogData, setOgData] = useState<OgResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const previewImageUrl = imageUrlProp ?? ogData?.image ?? null
  const hasImage = Boolean(previewImageUrl)

  const applyTriggerStyles = useCallback((el: HTMLAnchorElement | null) => {
    if (!el) return
    el.style.setProperty('text-decoration-line', 'underline', 'important')
    el.style.setProperty('text-decoration-style', 'solid', 'important')
    el.style.setProperty('text-decoration-color', 'var(--intro-trigger-decoration)', 'important')
    el.style.setProperty('text-decoration-thickness', '5%', 'important')
    el.style.setProperty('text-underline-offset', '0.05rem', 'important')
    el.style.setProperty('font-style', 'italic', 'important')
  }, [])

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

  useEffect(() => {
    if (!isHovered || imageUrlProp != null) return
    let cancelled = false
    setLoading(true)
    fetchOg(href)
      .then((data) => {
        if (!cancelled) setOgData(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isHovered, href, imageUrlProp])

  useEffect(() => {
    if (!isHovered) return
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [isHovered])

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
    if (!pos) return undefined
    const { left, top } = clampPosition(
      pos.x + CURSOR_OFFSET,
      pos.y + CURSOR_OFFSET,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT
    )
    return { left, top, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }
  }, [pos])

  const showCard = isHovered && boxStyle && hasImage && typeof document !== 'undefined'

  const previewBox = showCard ? (
    <div
      className="fixed z-50 rounded-lg overflow-hidden bg-stone-900 dark:bg-zinc-900 shadow-lg pointer-events-none"
      style={{
        left: boxStyle!.left,
        top: boxStyle!.top,
        width: boxStyle!.width,
        height: boxStyle!.height,
      }}
      aria-hidden
    >
      <div className="relative w-full h-full">
        <img
          src={previewImageUrl!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
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
              className="absolute bottom-0 left-0 right-0 pt-3 px-3 pb-0 text-sm font-normal leading-tight"
              style={{ color: 'rgb(231 229 228)' }}
            >
              {explanation}
            </p>
          </>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <a
        ref={applyTriggerStyles}
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
      {previewBox && createPortal(previewBox, document.body)}
    </>
  )
}

export default InlineLinkPreview
