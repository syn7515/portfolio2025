/**
 * The translucent plate that sits behind floating text so it stays readable over body copy without
 * reading as a separate surface. Deliberately not a card: no border, no radius, no drop shadow —
 * a 60%-opacity wash of the page background that fades out on all four edges (gradient left/right,
 * mask top/bottom) and is itself blurred, so it has no visible boundary at all. The text appears to
 * sit *on* the paper rather than hover above it.
 *
 * Shared by the inline link previews and the compact rail nav so the two can't drift apart.
 */
export function DescriptionBackdrop() {
  return (
    <span
      aria-hidden
      className="absolute -inset-x-6 -inset-y-4 z-0 rounded-xl blur-[2px]"
      style={{
        background: 'linear-gradient(to right, transparent 0, color-mix(in srgb, var(--background) 60%, transparent) 20px, color-mix(in srgb, var(--background) 60%, transparent) calc(100% - 20px), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
      }}
    />
  )
}

export default DescriptionBackdrop
