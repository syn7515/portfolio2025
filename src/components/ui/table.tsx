'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import styles from './table.module.css'

const FADE_SCROLL_THRESHOLD = 16

export interface TableProps {
  /** Column headers (order matches row cell order) */
  columns: React.ReactNode[]
  /** Rows: each row is an array of cells in the same order as columns */
  rows: React.ReactNode[][]
  /** Optional 0-based column index whose body cells use font-weight 500 */
  highlightColumn?: number
  className?: string
}

const theadBorderClasses = 'border-b border-stone-200 dark:border-zinc-800'
const thClasses =
  'pt-2 pb-2 pr-6 sm:pr-4 last:pr-0 whitespace-nowrap text-[13px] sm:text-[12px] uppercase text-stone-400 dark:text-zinc-500 font-[420] tracking-wider'
const tdBaseClasses =
  'py-1 pr-6 sm:pr-4 last:pr-0 whitespace-nowrap text-[15px] sm:text-[14px] text-stone-700 dark:text-zinc-300 dark:opacity-90 font-[420]'
const tdFirstRowClasses = 'pt-2'
const tdHighlightClasses = 'font-medium'

export function Table({
  columns,
  rows,
  highlightColumn,
  className,
}: TableProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const leftFadeRef = useRef<HTMLDivElement>(null)
  const rightFadeRef = useRef<HTMLDivElement>(null)

  const updateFadeOpacity = useCallback(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const maxScrollLeft = Math.max(
      0,
      scrollElement.scrollWidth - scrollElement.clientWidth
    )
    const scrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, scrollElement.scrollLeft)
    )
    const remainingScroll = maxScrollLeft - scrollLeft

    if (leftFadeRef.current) {
      leftFadeRef.current.style.opacity = String(
        Math.min(1, scrollLeft / FADE_SCROLL_THRESHOLD)
      )
    }

    if (rightFadeRef.current) {
      rightFadeRef.current.style.opacity = String(
        Math.min(1, remainingScroll / FADE_SCROLL_THRESHOLD)
      )
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    updateFadeOpacity()
    scrollElement.addEventListener('scroll', updateFadeOpacity, { passive: true })
    window.addEventListener('resize', updateFadeOpacity)

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateFadeOpacity)
    resizeObserver?.observe(scrollElement)
    const tableElement = scrollElement.querySelector('table')
    if (tableElement) resizeObserver?.observe(tableElement)

    return () => {
      scrollElement.removeEventListener('scroll', updateFadeOpacity)
      window.removeEventListener('resize', updateFadeOpacity)
      resizeObserver?.disconnect()
    }
  }, [updateFadeOpacity])

  return (
    <div
      className={cn(styles.wrapper, 'w-full mt-12 mb-9 sm:my-12', className)}
    >
      <div
        ref={scrollRef}
        className={cn(styles.scrollArea, 'w-full pb-3 sm:pb-0')}
        onScroll={updateFadeOpacity}
        role="region"
        aria-label="Scrollable table"
        tabIndex={0}
      >
        <table className="w-max min-w-full border-collapse text-left font-sans">
          <thead>
            <tr className={theadBorderClasses}>
              {columns.map((header, i) => (
                <th key={i} className={thClasses}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      tdBaseClasses,
                      rowIndex === 0 && tdFirstRowClasses,
                      highlightColumn === cellIndex && tdHighlightClasses
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        ref={leftFadeRef}
        aria-hidden
        className={cn(styles.fade, styles.leftFade)}
      />
      <div
        ref={rightFadeRef}
        aria-hidden
        className={cn(styles.fade, styles.rightFade)}
      />
    </div>
  )
}
