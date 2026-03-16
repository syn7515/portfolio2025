'use client'

import React from 'react'
import { cn } from '@/lib/utils'

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
  'pt-2 pb-3 pr-4 last:pr-0 text-[12px] uppercase text-stone-400 dark:text-zinc-500 font-[420]'
const tdBaseClasses =
  'py-1 pr-4 last:pr-0 text-[14px] text-stone-700 dark:text-zinc-300 dark:opacity-90 font-[420]'
const tdFirstRowClasses = 'pt-3'
const tdHighlightClasses = 'font-medium'

export function Table({
  columns,
  rows,
  highlightColumn,
  className,
}: TableProps) {
  return (
    <table
      className={cn(
        'w-full border-collapse my-12 text-left font-sans',
        className
      )}
    >
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
  )
}
