"use client";

import { useEffect, useRef } from 'react';

// No width clause: this component's layer lights up at every width (below 1024px it is the desk
// fixed to the screen behind the full-bleed paper, with the reveal footer's strip carrying a copy),
// and the paper's bottom-edge grid (.paper-grid-bottom) wants the position below 1024px too. Each
// is display-gated by its own media query in globals.css, so one that isn't showing reads its
// variables harmlessly.
const INTERACTIVE_GRID_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export default function PaperGridBackground() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    const interactiveGrid = window.matchMedia(INTERACTIVE_GRID_QUERY);
    if (!grid) return;

    // The bottom-edge grid is painted into the paper's own background rather than into a layer of
    // its own (globals.css explains why), so it can't read the position off this element — it needs
    // the pointer in its own box's coordinates. It's always a sibling: this component and the paper
    // sit next to each other under <main> on the home page and under the paper wrapper on a post.
    // A post's reveal footer, which takes that grid over below 1024px, sits under the same wrapper.
    const targets = [
      grid,
      ...(grid.parentElement?.querySelectorAll<HTMLElement>('.paper-grid-bottom, [data-paper-grid-pointer]') ?? []),
    ];

    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const renderPointerPosition = () => {
      frameId = 0;
      for (const target of targets) {
        const bounds = target.getBoundingClientRect();
        target.style.setProperty('--paper-grid-pointer-x', `${pointerX - bounds.left}px`);
        target.style.setProperty('--paper-grid-pointer-y', `${pointerY - bounds.top}px`);
        target.dataset.pointerActive = 'true';
      }
    };

    const schedulePointerPosition = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(renderPointerPosition);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!interactiveGrid.matches) {
        hidePointerEffect();
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
      schedulePointerPosition();
    };

    const handleViewportChange = () => {
      if (pointerActive) schedulePointerPosition();
    };

    const hidePointerEffect = () => {
      pointerActive = false;
      for (const target of targets) delete target.dataset.pointerActive;
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) hidePointerEffect();
    };

    const handleInteractionChange = () => {
      if (!interactiveGrid.matches) hidePointerEffect();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('blur', hidePointerEffect);
    interactiveGrid.addEventListener('change', handleInteractionChange);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('blur', hidePointerEffect);
      interactiveGrid.removeEventListener('change', handleInteractionChange);
    };
  }, []);

  // From 1024px the grid moves with the page, but a rubber-band overscroll mustn't take it along:
  // past either end only the sheet should move, over a desk that holds still, as it does below
  // 1024px. So the layer is fixed to the screen and moved by the scroll (globals.css). A
  // scroll-driven animation only reads the scroll position, which an overscroll doesn't change.
  // It needs three numbers CSS can't measure: where the page's wrapper starts, how tall it is, and
  // the scroll offset where the grid stops following. That is the end of the page, or, where the
  // footer comes out from under the sheet (RevealFooter's fromSheet marks it), the point where
  // the sheet's end reaches the foot of the screen, so the desk holds still while the sheet slides
  // up off the footer. They only change when the page's height or the viewport's does.
  // Until this has measured them the layer just scrolls with the page, which looks the same.
  useEffect(() => {
    const grid = gridRef.current;
    const wrapper = grid?.parentElement;
    if (!grid || !wrapper || !CSS.supports('animation-timeline', 'scroll()')) return;

    // With no footer to hold for, the grid follows to the end: the page's height stands in for the
    // end of the scroll, which it can't fall short of, and which the scroll height alone can (an
    // entrance's transforms change it without resizing anything this would hear about).
    const measure = () => {
      const scrollY = window.scrollY;
      const bounds = wrapper.getBoundingClientRect();
      const holdAt = wrapper.querySelector<HTMLElement>('[data-paper-grid-hold]');
      const hold = holdAt
        ? Math.max(0, holdAt.getBoundingClientRect().top + scrollY - window.innerHeight)
        : bounds.bottom + scrollY;
      grid.style.setProperty('--paper-grid-desk-top', `${bounds.top + scrollY}px`);
      grid.style.setProperty('--paper-grid-desk-h', `${bounds.height}px`);
      grid.style.setProperty('--paper-grid-desk-hold', `${hold}px`);
      grid.dataset.deskFollow = '';
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return <div ref={gridRef} aria-hidden className="paper-grid-background" />;
}
