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
 * onSettle runs once the scroll is over, with whether it got there or the reader took over. The
 * returned function stops the scroll where it is, which counts as taking over.
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

  const listenerOptions = { passive: true, signal: controller.signal }
  window.addEventListener('wheel', interrupt, listenerOptions)
  window.addEventListener('touchmove', interrupt, listenerOptions)
  window.addEventListener('pointerdown', interrupt, listenerOptions)
  window.addEventListener('keydown', handleKeyDown, { signal: controller.signal })
  window.addEventListener('scrollend', () => cleanUp(false), { once: true, signal: controller.signal })

  const fallbackTimer = window.setTimeout(() => cleanUp(false), 2000)
  window.scrollTo({ top, behavior: 'smooth' })

  return interrupt
}
