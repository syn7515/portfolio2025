"use client"

import React from 'react'

interface BlogPostHeaderProps {
  slug?: string
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[560px] mx-auto mb-[100px] text-left">
      {/* Subtitle / metadata - small, light grey */}
      {subtitle && (
        <p className="text-sm font-normal !text-stone-500 dark:!text-zinc-500 !mb-3">
          {subtitle}
        </p>
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
