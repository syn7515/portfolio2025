"use client"


interface BlogPostHeaderProps {
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ title, subtitle }: BlogPostHeaderProps) {
  // The gap under the header stays short of the paper's top margin over the title (its top padding
  // in blog-post-layout.tsx), so the title sits nearer the text it heads than the paper's edge: by
  // eye, ink to ink, about three quarters of it. On the sheet that is 72px under the 100px margin
  // until 1200px, then this rises on that margin's ramp, to 100px under its 140px by 1500px (28px
  // over 300px = 9.333vw; intercept 72px - 112px = -2.5rem). Below the sheet it was already well
  // short of it. The space over the title is all the paper's padding; the header adds none.
  // The 640px step is written min-[640px] rather than sm: Tailwind emits the rem-based sm rules
  // after the px-based sheet and paper ones, so sm would override them.
  return (
    <header className="max-w-[var(--content-w)] mx-auto mb-14 min-[640px]:mb-20 sheet:mb-[72px] paper:mb-[clamp(4.5rem,calc(9.333vw_-_2.5rem),6.25rem)] text-left">
      {/* Title. 40px on the sheet (1024px up) — the display size, since that is where the case
          study becomes a sheet with a margin around it and the title is the only thing on it above
          the fold. Below the sheet it slides from 40px at 1024px down to 32px at 640px, then
          steps to the 26px phone size. From 640px the column and body copy are already the
          sheet's (560px, 15px), so a title well under 40 there read as undersized against them; the
          step lands at 640px because the rest of this header changes there too (spacing, the
          subtitle), and it keeps the ramp continuous into the sheet. Slope is 8px over 384px =
          2.0833vw; the intercept is 32px - 640px * 0.020833 = 18.667px. From 1280px the 40px cap
          rises with the column, to ~42.7px by 1680px (--text-px in globals.css).

          On a phone it matches the home name (26px, see the h1 in app/page.tsx), so a reader
          arriving from home meets the same voice at the same scale; above that the title runs
          larger than the name, which never has the page to itself.

          Tracking is -0.03em at every size: -1.2px at 40px, -0.78px at 26px, which is where the
          home name's flat -0.75px sits. A flat px value would read noticeably loose at the top of
          the ramp. It lives on the utility rather than the inline style only to keep the type
          settings in one place. */}
      <h1
        className="!mt-0 !text-[26px] sm:!text-[clamp(32px,calc(2.0833vw_+_18.667px),calc(40*var(--text-px)))] !tracking-[-0.03em] !text-stone-700 dark:!text-zinc-200 !mb-0 whitespace-pre-line"
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
        <p className="hidden sm:block !text-[calc(0.875*var(--text-rem))] !font-[460] !leading-[165%] !tracking-normal !mt-3 !mb-0 !text-stone-500 dark:!text-zinc-400">
          {subtitle}
        </p>
      )}
    </header>
  )
}
