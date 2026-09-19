import { cn } from '@/lib/utils'

/**
 * The "this link leaves the site" mark, shared by the inline link previews, the project list's
 * off-site rows and the case-study prose.
 *
 * Its size, colour and raise are the ones the project list uses, so the mark reads the same
 * wherever it appears rather than taking on the weight of whatever text it follows.
 *
 * The size is a flat 11px, not an em: em is what made it inconsistent in the first place, since the
 * links it sits in run from 14px prose to a 19px project title and the mark came out anywhere from
 * 8.7px to 11.8px. 11px is what the project list was already rendering.
 *
 * Three things about it are load-bearing rather than cosmetic, which is why it lives here instead
 * of being written out at each call site:
 *
 * - `font-sans`. The mark is U+2197, which Crimson Pro does not carry — project titles are set in
 *   it, so the glyph would fall through to whatever the system substitutes and change shape between
 *   platforms. Inter has it and is already loaded.
 * - `inline-block`. The links this sits in underline themselves, and text-decoration propagates to
 *   inline descendants; an inline-block child is excluded, which is what keeps the underline off
 *   the glyph. It also makes the hover nudge in the project list possible at all — transforms do
 *   not apply to non-replaced inline boxes.
 * - `relative`/`-top` rather than `vertical-align: super`, matching how sup-badge.ts raises the
 *   reference marks. vertical-align would grow the line box, pushing the line away from the one
 *   above it.
 *
 * The colour is pinned rather than inherited, so `group-hover` is how it follows its link into the
 * hover state — every call site puts `group` on the anchor.
 *
 * `not-italic` keeps the glyph upright inside `.intro-link`, which is italic; that is inherited, so
 * a plain declaration here beats it without needing its own !important.
 */
export default function ExternalArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative -top-[0.34em] inline-block not-italic text-[11px] leading-none font-sans pl-[2px]',
        '!text-stone-400 dark:!text-zinc-500 transition-colors duration-150',
        'group-hover:!text-rose-700 group-active:!text-rose-700 group-focus-visible:!text-rose-700',
        'dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400 dark:group-focus-visible:!text-rose-400',
        className
      )}
    >
      ↗
    </span>
  )
}
