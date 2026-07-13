"use client";

import { useEffect, useRef } from 'react';

const INTERACTIVE_GRID_QUERY = '(min-width: 1280px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export default function PaperGridBackground() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    const interactiveGrid = window.matchMedia(INTERACTIVE_GRID_QUERY);
    if (!grid) return;

    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const renderPointerPosition = () => {
      frameId = 0;
      const bounds = grid.getBoundingClientRect();
      grid.style.setProperty('--paper-grid-pointer-x', `${pointerX - bounds.left}px`);
      grid.style.setProperty('--paper-grid-pointer-y', `${pointerY - bounds.top}px`);
      grid.dataset.pointerActive = 'true';
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
      delete grid.dataset.pointerActive;
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
