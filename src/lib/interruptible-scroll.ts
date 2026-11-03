import { scrollBehavior } from '@/lib/utils'

// Keys that scroll against the ride. One that scrolls along with it would only carry the reader
// where they are already going, so it is left to add to the scroll rather than stop it.
const UP_KEYS = ['ArrowUp', 'PageUp', 'Home']
const DOWN_KEYS = ['ArrowDown', 'PageDown', 'End']

/**
 * Smooth-scrolls the window to `top` and lets the reader take over: a wheel, touch drag, pointer
 * press or a key against the ride stops it where it is. The back-to-top button and the TOC's jumps
 * to a heading share it.
 *
 * onSettle runs once the scroll is over, with whether it stopped short of `top`: the reader took
 * over, or something else cut the smooth scroll off. The returned function stops the scroll where
 * it is, which counts as stopping short.
 */
export function startInterruptibleScroll(
  top: number,
  onSettle: (interrupted: boolean) => void
): () => void {
  // A heading near the end of the page can ask for more than the page scrolls; past the end the
  // window would not move and so fire no scrollend.
  top = Math.min(Math.max(0, top), document.documentElement.scrollHeight - window.innerHeight)
  const distance = top - window.scrollY
  // No smooth scroll to wait on: an instant jump, or one already at its target, which fires no
  // scrollend and would hold on until the fallback.
  if (scrollBehavior() === 'auto' || Math.abs(distance) < 1) {
    window.scrollTo({ top, behavior: 'auto' })
    onSettle(false)
    return () => {}
  }

  const controller = new AbortController()
  let finished = false

  const cleanUp = (interrupted: boolean) => {
    if (finished) return
    finished = true
    controller.abort()
    window.clearTimeout(fallbackTimer)
    onSettle(interrupted)
  }

  const interrupt = () => {
    if (finished) return
    window.scrollTo({ top: window.scrollY, behavior: 'auto' })
    cleanUp(true)
  }

  const goingDown = distance > 0
  const handleKeyDown = (event: KeyboardEvent) => {
    // Space scrolls down, Shift+Space up.
    const keyGoesDown = event.key === ' ' ? !event.shiftKey : DOWN_KEYS.includes(event.key)
    const keyGoesUp = event.key === ' ' ? event.shiftKey : UP_KEYS.includes(event.key)
    if (goingDown ? keyGoesUp : keyGoesDown) interrupt()
  }

  // The window coming to rest is what ends the scroll, not a scrollend alone: one can arrive from
  // a scroll that was still settling when this one started (a click mid-momentum), and taking it
  // for this one's would drop the listeners above with the ride still going. So a scrollend short
  // of the target only counts once the window has held still for two frames; still moving, it
  // checks again shortly, which is also the fallback for a browser without scrollend.
  const settleWhenStill = () => {
    if (finished) return
    if (Math.abs(window.scrollY - top) < 2) {
      cleanUp(false)
      return
    }
    const y = window.scrollY
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (finished) return
        if (window.scrollY === y) {
          cleanUp(true)
        } else {
          window.clearTimeout(fallbackTimer)
          fallbackTimer = window.setTimeout(settleWhenStill, 500)
        }
      })
    )
  }

  const listenerOptions = { passive: true, signal: controller.signal }
  window.addEventListener('wheel', interrupt, listenerOptions)
  window.addEventListener('touchmove', interrupt, listenerOptions)
  window.addEventListener('pointerdown', interrupt, listenerOptions)
  window.addEventListener('keydown', handleKeyDown, { signal: controller.signal })
  window.addEventListener('scrollend', settleWhenStill, { signal: controller.signal })

  let fallbackTimer = window.setTimeout(settleWhenStill, 2000)
  window.scrollTo({ top, behavior: 'smooth' })

  return interrupt
}
