"use client"

import { useState, useEffect, useRef } from 'react'

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
      style={id === 1 || id === 4 ? { paddingRight: '1px' } : undefined}
      className={`inline-flex items-center justify-center rounded-full w-[13px] h-[13px] text-[10px] leading-none font-medium text-white cursor-pointer select-none relative -top-[5px] ml-[2px] transition-colors duration-300 ease-out ${
        isHighlighted
          ? 'bg-orange-700 dark:bg-lime-200 dark:text-zinc-900'
          : 'bg-stone-300 hover:bg-orange-700 dark:bg-zinc-600 dark:hover:bg-lime-200 dark:hover:text-zinc-900'
      }`}
    >
      {id}
    </span>
  )
}
