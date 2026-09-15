"use client"


interface BlogPostHeaderProps {
  slug?: string
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[560px] mx-auto pt-4 sm:pt-0 mb-14 sm:mb-20 lg:mb-[100px] text-left">
      {/* Subtitle / metadata - small, light grey */}
      {subtitle && (
        <p className="!text-[13px] !font-[400] !leading-[150%] !tracking-[0rem] !mb-2.5 sm:!text-sm sm:!font-[460] sm:!leading-[165%] sm:!tracking-normal sm:!mb-3 !text-stone-500 dark:!text-zinc-400">
          {subtitle}
        </p>
      )}
      {/* Title - typography per design spec */}
      <h1
        className="!mt-0 !text-[clamp(1.625rem,8.72vw,1.875rem)] sm:!text-[clamp(2.125rem,8.72vw,2.5rem)] !text-stone-700 dark:!text-zinc-200 !mb-0 whitespace-pre-line"
        style={{
          fontFamily: 'var(--font-crimson-pro), serif',
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
