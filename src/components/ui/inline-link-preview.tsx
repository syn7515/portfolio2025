"use client"

import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const HOVER_DELAY_MS = 150
const SIDE_RAIL_BREAKPOINT = 1280
const SIDE_RAIL_GAP = 32
const SIDE_RAIL_MAX_WIDTH = 320
const VIEWPORT_EDGE_GAP = 24
const SIDE_RAIL_MIN_WIDTH = 220
const LOCAL_DESCRIPTION_MAX_WIDTH = 480

interface SideRailPosition {
  left: number
  top: number
  width: number
}

interface LocalDescriptionLayout {
  left: number
  width: number
}

function DescriptionBackdrop() {
  return (
    <span
      aria-hidden
      className="absolute -inset-x-6 -inset-y-4 z-0 blur-[2px]"
      style={{
        background: 'linear-gradient(to right, transparent 0, color-mix(in srgb, var(--background) 60%, transparent) 20px, color-mix(in srgb, var(--background) 60%, transparent) calc(100% - 20px), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
      }}
    />
  )
}

export interface InlineLinkPreviewProps {
  href: string
  children: ReactNode
  explanation?: string
  descriptionPosition?: 'right' | 'top' | 'bottom'
  smallViewportDescriptionPosition?: 'top' | 'bottom'
  className?: string
  variant?: 'intro-link' | 'intro-link-light'
}

export function InlineLinkPreview({
  href,
  children,
  explanation,
  descriptionPosition = 'right',
  smallViewportDescriptionPosition = 'bottom',
  className,
  variant = 'intro-link',
}: InlineLinkPreviewProps) {
  const [showExplanation, setShowExplanation] = useState(false)
  const [sideRailPosition, setSideRailPosition] = useState<SideRailPosition | null>(null)
  const [localDescriptionLayout, setLocalDescriptionLayout] = useState<LocalDescriptionLayout | null>(null)
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const descriptionId = useId()

  const clearHoverDelay = useCallback(() => {
    if (!hoverDelayRef.current) return
    clearTimeout(hoverDelayRef.current)
    hoverDelayRef.current = null
  }, [])

  const updateSideRailPosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      setSideRailPosition(null)
      setLocalDescriptionLayout(null)
      return
    }

    const anchorRect = anchor.getBoundingClientRect()
    if (descriptionPosition === 'right' && window.innerWidth >= SIDE_RAIL_BREAKPOINT) {
      const boundary = anchor.closest('[data-inline-link-preview-boundary]') as HTMLElement | null
      if (boundary) {
        const left = boundary.getBoundingClientRect().right + SIDE_RAIL_GAP
        const width = Math.min(SIDE_RAIL_MAX_WIDTH, window.innerWidth - left - VIEWPORT_EDGE_GAP)

        if (width >= SIDE_RAIL_MIN_WIDTH) {
          setSideRailPosition({
            left,
            top: Math.max(VIEWPORT_EDGE_GAP, Math.min(anchorRect.top - 1, window.innerHeight - 72)),
            width,
          })
          setLocalDescriptionLayout(null)
          return
        }
      }
    }

    const width = Math.min(LOCAL_DESCRIPTION_MAX_WIDTH, window.innerWidth - VIEWPORT_EDGE_GAP * 2)
    const viewportLeft = Math.max(
      VIEWPORT_EDGE_GAP,
      Math.min(anchorRect.left, window.innerWidth - VIEWPORT_EDGE_GAP - width)
    )
    setSideRailPosition(null)
    setLocalDescriptionLayout({
      left: viewportLeft - anchorRect.left,
      width,
    })
  }, [descriptionPosition])

  const revealExplanation = useCallback(() => {
    updateSideRailPosition()
    setShowExplanation(true)
  }, [updateSideRailPosition])

  const handleMouseEnter = useCallback(() => {
    clearHoverDelay()
    hoverDelayRef.current = setTimeout(() => {
      revealExplanation()
      hoverDelayRef.current = null
    }, HOVER_DELAY_MS)
  }, [clearHoverDelay, revealExplanation])

  const hideExplanation = useCallback(() => {
    clearHoverDelay()
    setShowExplanation(false)
    setSideRailPosition(null)
    setLocalDescriptionLayout(null)
  }, [clearHoverDelay])

  useEffect(() => clearHoverDelay, [clearHoverDelay])

  useEffect(() => {
    if (!showExplanation) return

    window.addEventListener('resize', updateSideRailPosition, { passive: true })
    window.addEventListener('scroll', updateSideRailPosition, true)
    return () => {
      window.removeEventListener('resize', updateSideRailPosition)
      window.removeEventListener('scroll', updateSideRailPosition, true)
    }
  }, [descriptionPosition, showExplanation, updateSideRailPosition])

  const localDescriptionPosition = descriptionPosition === 'right'
    ? smallViewportDescriptionPosition
    : descriptionPosition
  const isAbove = localDescriptionPosition === 'top'
  const showLocalExplanation = showExplanation && explanation && !sideRailPosition
  const showSideRailExplanation = showExplanation && explanation && sideRailPosition

  return (
    <>
      {/* A true inline wrapper keeps Safari from recalculating an inline-block baseline when the
          trigger's opacity changes on hover. */}
      <span className="relative inline align-baseline [line-height:inherit]">
        <a
          ref={anchorRef}
          data-inline-link-preview-trigger
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={hideExplanation}
          onFocus={() => {
            clearHoverDelay()
            revealExplanation()
          }}
          onBlur={hideExplanation}
          className={cn(
            variant,
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600/40 focus-visible:ring-offset-1 rounded',
            className
          )}
          aria-describedby={explanation ? descriptionId : undefined}
        >
          {children}
        </a>

        {explanation && <span id={descriptionId} className="sr-only">{explanation}</span>}

        <AnimatePresence>
          {showLocalExplanation && (
            <motion.span
              aria-hidden
              className={cn(
                'pointer-events-none absolute z-50 isolate block whitespace-normal text-[20px] font-normal leading-[1.15] tracking-[-0.01em] text-stone-700 dark:text-zinc-200',
                isAbove
                  ? 'bottom-full origin-bottom-left'
                  : 'top-full origin-top-left'
              )}
              style={{
                left: localDescriptionLayout?.left ?? 0,
                width: localDescriptionLayout?.width,
                fontFamily: 'var(--font-biro-script), "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
              }}
              initial={{ opacity: 0, y: isAbove ? 4 : -4, filter: 'blur(1.5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: isAbove ? 2 : -2, filter: 'blur(1px)' }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <DescriptionBackdrop />
              <span className="relative z-10 xl:text-balance">{explanation}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSideRailExplanation && (
            <motion.span
              aria-hidden
              className="pointer-events-none fixed z-50 isolate block whitespace-normal text-[22px] font-normal leading-[1.15] tracking-[-0.01em] text-stone-700 dark:text-zinc-200"
              style={{
                left: sideRailPosition.left,
                top: sideRailPosition.top,
                width: sideRailPosition.width,
                fontFamily: 'var(--font-biro-script), "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
              }}
              initial={{ opacity: 0, filter: 'blur(1.5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(1px)' }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <DescriptionBackdrop />
              <span className="relative z-10 xl:text-balance">{explanation}</span>
            </motion.span>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default InlineLinkPreview
