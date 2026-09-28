"use client"


interface BlogPostHeaderProps {
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[var(--content-w)] mx-auto pt-4 sm:pt-0 mb-14 sm:mb-20 lg:mb-[100px] text-left">
      {/* Title. 40px on the sheet (1024px up) — the display size, since that is where the case
          study becomes a sheet with a margin around it and the title is the only thing on it above
          the fold. Below the sheet it slides from 36px at 1024px to the 26px phone size by 640px
          and holds there, leaving a small 36-to-40px step for the sheet's arrival. Slope is 10px
          over 384px = 2.6042vw; the intercept is 26px - 640px * 0.026042 = 9.333px.

          It ends where the home name does (26px at 640px, see the h1 in app/page.tsx), so on a
          phone a reader arriving from home meets the same voice at the same scale; above that the
          title runs larger than the name, which never has the page to itself.

          Tracking is -0.03em at every size: -1.2px at 40px, -0.78px at 26px, which is where the
          home name's flat -0.75px sits. A flat px value would read noticeably loose at the top of
          the ramp. It lives on the utility rather than the inline style only to keep the type
          settings in one place. */}
      <h1
        className="!mt-0 !text-[clamp(26px,calc(2.6042vw_+_9.333px),36px)] sheet:!text-[2.5rem] !tracking-[-0.03em] !text-stone-700 dark:!text-zinc-200 !mb-0 whitespace-pre-line"
        style={{
          fontFamily: 'var(--font-crimson-pro), serif',
          lineHeight: '120%',
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
