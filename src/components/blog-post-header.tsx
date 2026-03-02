"use client"

import React from 'react'
import { Divider } from '@/components/ui/divider'

interface BlogPostHeaderProps {
  slug?: string
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[560px] mx-auto mb-[100px] text-center">
      {/* Subtitle / metadata - small, light grey */}
      {subtitle && (
        <>
          <p className="text-sm font-normal !text-stone-400 dark:text-zinc-400 !mb-1">
            {subtitle}
          </p>
          <div className="my-4 flex justify-center">
            <Divider orientation="horizontal" color="stone" variant="default" className="!w-3 shrink-0 my-0" />
          </div>
        </>
      )}
      {/* Title - typography per design spec */}
      <h1
        className="!mt-0 text-stone-800 dark:text-zinc-200 !font-medium !mb-0 !dark:text-zinc-100 whitespace-pre-line"
        style={{
          fontFamily: 'var(--font-libre-caslon), serif',
          fontSize: '32px',
          lineHeight: '150%',
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </h1>
    </header>
  )
}
