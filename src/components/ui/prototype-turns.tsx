"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";

/* Live prototypes sharing one card (recipe-select-demo.tsx, cleaning-mode-demo.tsx). Each page is
   framed into the whole card, one over the other, so all measure against the card; no layer takes
   the pointer, which leaves the screens under it to their own iframes.

   Their pages (?turns) take turns rather than playing at once: each posts its take's length, and
   once all are in, each is told its turn in a cycle as long as them all, in the order they're given
   here. Turns run on the wall clock, so the lightbox's copy of the card plays the same one as the
   card. */
export default function PrototypeTurns({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Indexed in the order the pages take their turns, which is their order here.
    const lengths: number[] = [];
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "proto:length") return;
      const frames = [...(ref.current?.querySelectorAll("iframe") ?? [])];
      const i = frames.findIndex((f) => f.contentWindow === e.source);
      if (i < 0) return;
      lengths[i] = e.data.length;
      if (frames.some((_, j) => lengths[j] === undefined)) return;
      const period = lengths.reduce((sum, length) => sum + length, 0);
      let offset = 0;
      frames.forEach((f, j) => {
        f.contentWindow?.postMessage({ type: "proto:turn", period, offset }, window.location.origin);
        offset += lengths[j];
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div ref={ref} className="relative w-full h-full">
      {Children.map(children, (child) => (
        <div className="absolute inset-0 pointer-events-none">{child}</div>
      ))}
    </div>
  );
}
