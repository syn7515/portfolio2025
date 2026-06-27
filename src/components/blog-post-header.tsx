"use client"


interface BlogPostHeaderProps {
  slug?: string
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[560px] mx-auto mb-16 xs:mb-16 sm:mb-20 lg:mb-[100px] text-left">
      {/* Subtitle / metadata - small, light grey */}
      {subtitle && (
        <p className="text-sm !text-stone-500 dark:!text-zinc-500 !mb-3" style={{ fontWeight: 460 }}>
          {subtitle}
        </p>
      )}
      {/* Title - typography per design spec */}
      <h1
        className="!mt-0 !text-stone-700 dark:!text-zinc-200 !mb-0 whitespace-pre-line"
        style={{
          fontFamily: 'var(--font-crimson-pro), serif',
          fontSize: '40px',
          lineHeight: '120%',
          letterSpacing: '-0.03em',
          fontWeight: 360,
          textWrap: 'balance',
        }}
      >
        {title}
      </h1>
    </header>
  )
}
