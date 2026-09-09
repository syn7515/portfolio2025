"use client";

import { useEffect, useRef } from 'react';

// No width clause: two grids want this pointer position and they live on opposite sides of 1280px
// — this component's own layer above it, and the paper's bottom-edge grid (.paper-grid-bottom)
// below it. Each is display-gated by its own media query in globals.css, so at any given width only
// one of them can actually light up and the other reads its variables harmlessly.
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
    const paper = grid.parentElement?.querySelector<HTMLElement>('.paper-grid-bottom') ?? null;
    const targets = paper ? [grid, paper] : [grid];

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

  return <div ref={gridRef} aria-hidden className="paper-grid-background" />;
}
