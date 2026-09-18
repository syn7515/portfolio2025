"use client"


interface BlogPostHeaderProps {
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[560px] mx-auto pt-4 sm:pt-0 mb-14 sm:mb-20 lg:mb-[100px] text-left">
      {/* Title. Size, tracking, weight and leading are kept identical to the name on the home page
          (see the h1 in app/page.tsx) so a reader arriving from there sees the same voice at the
          same scale — the two are a matched pair, and the ramp below is that one verbatim: 26px up
          to 640px, sliding to 32px by 1200px. Because the sizes now agree exactly, the tracking can
          be the same absolute -0.75px rather than a converted em value. Change one, change both. */}
      <h1
        className="!mt-0 !text-[clamp(26px,calc(1.0714vw_+_19.143px),32px)] !text-stone-700 dark:!text-zinc-200 !mb-0 whitespace-pre-line"
        style={{
          fontFamily: 'var(--font-crimson-pro), serif',
          lineHeight: '120%',
          letterSpacing: '-0.75px',
          fontWeight: 360,
          textWrap: 'balance',
        }}
      >
        {title}
      </h1>
      {/* Client and dates, under the title rather than over it: the title is what the reader came
          for, so it opens the page and this follows as the caption to it.

          Phones do not get it at all. The line is context a desktop reader takes in alongside the
          title without paying for it; on a narrow column it becomes one more thing stacked above
          the fold, and the same dates are already on the home page's project list. Hidden below
          640px, which is where this header's own type and spacing steps change.

          All the type values are unprefixed because the element only ever exists at 640px and up —
          a `sm:` prefix on them would describe a state that never renders. */}
      {subtitle && (
        <p className="hidden sm:block !text-sm !font-[460] !leading-[165%] !tracking-normal !mt-3 !mb-0 !text-stone-500 dark:!text-zinc-400">
          {subtitle}
        </p>
      )}
    </header>
  )
}
