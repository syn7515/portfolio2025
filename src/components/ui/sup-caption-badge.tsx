"use client"

import type { ReactNode } from "react"
import { useState, useEffect, useRef } from "react"
import { SUP_BADGE_BASE_CLASS, SUP_BADGE_DEFAULT_CLASS, SUP_BADGE_CAROUSEL_CLASS, SUP_BADGE_HIGHLIGHTED_CLASS } from "@/components/ui/sup-badge"
import { scrollBehavior } from "@/lib/utils"

export function CaptionSupBadge({ supId, muted = false }: { supId: string; muted?: boolean }) {
  const [isHighlighted, setIsHighlighted] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }

    const handler = (e: CustomEvent<{ supId: string | number }>) => {
      if (String(e.detail.supId) === supId) {
        clearTimers()
        const t1 = setTimeout(() => {
          setIsHighlighted(true)
          const t2 = setTimeout(() => setIsHighlighted(false), 600)
          timersRef.current.push(t2)
        }, 800)
        timersRef.current.push(t1)
      }
    }

    window.addEventListener('sup-caption-highlight', handler as EventListener)
    return () => {
      window.removeEventListener('sup-caption-highlight', handler as EventListener)
      clearTimers()
    }
  }, [supId])

  return (
    <span
      id={`sup-caption-${supId}`}
      onClick={(e) => {
        e.stopPropagation()
        document.getElementById(`sup-body-${supId}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
        window.dispatchEvent(new CustomEvent('sup-highlight', { detail: { supId } }))
      }}
      style={supId === '1' ? { paddingRight: '1px' } : undefined}
      className={`${SUP_BADGE_BASE_CLASS} ${
        isHighlighted ? SUP_BADGE_HIGHLIGHTED_CLASS : muted ? SUP_BADGE_CAROUSEL_CLASS : SUP_BADGE_DEFAULT_CLASS
      }`}
    >
      {supId}
    </span>
  )
}

export function renderCaptionWithBadges(caption: string, options?: { muted?: boolean }): ReactNode {
  const parts = caption.split(/(<sup>\d+<\/sup>)/g)
  if (parts.length === 1) return <span dangerouslySetInnerHTML={{ __html: caption }} />
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^<sup>(\d+)<\/sup>$/)
        if (match) return <CaptionSupBadge key={i} supId={match[1]} muted={options?.muted} />
        return part ? <span key={i} dangerouslySetInnerHTML={{ __html: part }} /> : null
      })}
    </>
  )
}
