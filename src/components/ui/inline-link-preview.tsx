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

interface SideRailPosition {
  left: number
  top: number
  width: number
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
    if (!anchor || descriptionPosition !== 'right' || window.innerWidth < SIDE_RAIL_BREAKPOINT) {
      setSideRailPosition(null)
      return
    }

    const anchorRect = anchor.getBoundingClientRect()
    const boundary = anchor.closest('[data-inline-link-preview-boundary]') as HTMLElement | null
    if (!boundary) {
      setSideRailPosition(null)
      return
    }

    const left = boundary.getBoundingClientRect().right + SIDE_RAIL_GAP
    const width = Math.min(SIDE_RAIL_MAX_WIDTH, window.innerWidth - left - VIEWPORT_EDGE_GAP)

    if (width < SIDE_RAIL_MIN_WIDTH) {
      setSideRailPosition(null)
      return
    }

    setSideRailPosition({
      left,
      top: Math.max(VIEWPORT_EDGE_GAP, Math.min(anchorRect.top - 1, window.innerHeight - 72)),
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
  }, [clearHoverDelay])

  useEffect(() => clearHoverDelay, [clearHoverDelay])

  useEffect(() => {
    if (!showExplanation || descriptionPosition !== 'right') return

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
      <span className="relative inline-block">
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
                'pointer-events-none absolute z-50 block w-max max-w-none whitespace-nowrap text-[20px] font-normal leading-none tracking-[-0.01em] text-stone-700 dark:text-zinc-200',
                isAbove
                  ? 'bottom-full left-0 origin-bottom-left'
                  : 'top-full left-0 origin-top-left'
              )}
              style={{
                fontFamily: '"Biro Script", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
              }}
              initial={{ opacity: 0, y: isAbove ? 4 : -4, filter: 'blur(1.5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: isAbove ? 2 : -2, filter: 'blur(1px)' }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {explanation}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSideRailExplanation && (
            <motion.span
              aria-hidden
              className="pointer-events-none fixed z-50 block whitespace-normal text-[22px] font-normal leading-[1.15] tracking-[-0.01em] text-stone-700 dark:text-zinc-200"
              style={{
                left: sideRailPosition.left,
                top: sideRailPosition.top,
                width: sideRailPosition.width,
                fontFamily: '"Biro Script", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
              }}
              initial={{ opacity: 0, filter: 'blur(1.5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(1px)' }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {explanation}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default InlineLinkPreview
