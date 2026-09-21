"use client"


interface BlogPostHeaderProps {
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[560px] mx-auto pt-4 sm:pt-0 mb-14 sm:mb-20 lg:mb-[100px] text-left">
      {/* Title. Two sizes, split at the paper breakpoint.

          Below 1200px it keeps the name on the home page verbatim (see the h1 in app/page.tsx):
          26px up to 640px, sliding to 32px by 1200px, tracked a flat -0.75px. There the paper is
          full-bleed and the column *is* the viewport, so a reader arriving from home meets the
          same voice at the same scale. Change one, change both.

          From 1200px up the sheet lifts off the page and this goes back to the 40px display size
          it carried before the two were matched. That width is where the case study stops being a
          column and becomes a sheet with a margin around it, and where the title is the only thing
          on it above the fold — the home name never is, which is why it does not follow. The step
          at the breakpoint is 32 to 40px, landing with everything else that changes there.

          Tracking moves with the size and so has to leave the inline style, which no media query
          can reach: -0.03em is -1.2px at 40px, where the flat -0.75px would read as -0.019em and
          noticeably loose. An inline letterSpacing would outrank both utilities. */}
      <h1
        className="!mt-0 !text-[clamp(26px,calc(1.0714vw_+_19.143px),32px)] paper:!text-[2.5rem] !tracking-[-0.75px] paper:!tracking-[-0.03em] !text-stone-700 dark:!text-zinc-200 !mb-0 whitespace-pre-line"
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
