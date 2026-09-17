/**
 * The translucent plate that sits behind floating text so it stays readable over body copy without
 * reading as a separate surface. Deliberately not a card: no border, no shadow, and no straight
 * edge anywhere — a rounded wash of the page background whose own Gaussian blur *is* its falloff,
 * so it dissolves into the page on every side at once.
 *
 * It used to be a horizontal gradient crossed with a vertical mask. Two linear ramps meeting at a
 * corner still describe a rectangle, and over a dark screenshot that rectangle was plainly visible.
 * A blurred rounded shape has no corner to give away: the radius rounds the core, and the blur
 * radius sets how far the wash reaches past it.
 *
 * Two stacked layers rather than one. A single blur wide enough to fade out gently also thins the
 * cover directly under the text; the tight core keeps the text backed while the wide, faint halo
 * carries the long tail out into the page.
 *
 * 28px rather than a pill: the rail's single-line labels are short enough that this already reads
 * as fully rounded, while the multi-line link previews keep their widest line's ends covered
 * instead of having the curve bite into them.
 *
 * Shared by the inline link previews and the compact rail nav so the two can't drift apart.
 */
export function DescriptionBackdrop() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-7 z-0 rounded-[44px] blur-[18px]"
        style={{ background: 'color-mix(in srgb, var(--background) 30%, transparent)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-5 -inset-y-[14px] z-0 rounded-[28px] blur-[9px]"
        style={{ background: 'color-mix(in srgb, var(--background) 48%, transparent)' }}
      />
    </>
  )
}

export default DescriptionBackdrop
