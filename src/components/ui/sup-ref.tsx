"use client"

import { useState, useEffect, useRef } from 'react'
import { SUP_BADGE_BASE_CLASS, SUP_BADGE_DEFAULT_CLASS, SUP_BADGE_HIGHLIGHTED_CLASS } from '@/components/ui/sup-badge'

interface SupRefProps {
  id: number
}

export default function SupRef({ id }: SupRefProps) {
  const [isHighlighted, setIsHighlighted] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }

    const handler = (e: CustomEvent<{ supId: string | number }>) => {
      if (Number(e.detail.supId) === id) {
        clearTimers()
        // Wait for smooth scroll to land, then blink
        const t1 = setTimeout(() => {
          setIsHighlighted(true)
          const t2 = setTimeout(() => setIsHighlighted(false), 600)
          timersRef.current.push(t2)
        }, 700)
        timersRef.current.push(t1)
      }
    }

    window.addEventListener('sup-highlight', handler as EventListener)
    return () => {
      window.removeEventListener('sup-highlight', handler as EventListener)
      clearTimers()
    }
  }, [id])

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('sup-navigate', { detail: { supId: id } }))
    window.dispatchEvent(new CustomEvent('sup-caption-highlight', { detail: { supId: id } }))
  }

  return (
    <span
      id={`sup-body-${id}`}
      onClick={handleClick}
      className={`${SUP_BADGE_BASE_CLASS} ${
        isHighlighted ? SUP_BADGE_HIGHLIGHTED_CLASS : SUP_BADGE_DEFAULT_CLASS
      }`}
    >
      <span
        aria-hidden="true"
        data-sup-hit-area
        className="pointer-events-auto absolute inset-x-[-6px] inset-y-[-7px]"
      />
      [<span className="mx-[0.5px]">{id}</span>]
    </span>
  )
}
