"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/* Live prototypes sharing one card (recipe-select-demo.tsx, cleaning-mode-demo.tsx). Each page is
   framed into the whole card, one over the other, so all measure against the card; no layer takes
   the pointer, which leaves the screens under it to their own iframes.

   Their pages (?turns) take turns rather than playing at once: each posts its take's length, and
   once all are in, each is told its turn in a cycle as long as them all, in the order they're given
   here. Turns run on the wall clock, so the lightbox's copy of the card plays the same one as the
   card. A page waiting for its turn is marked data-turn-waiting, which has its screen recede
   (live-prototype.tsx: translucent, grey, flatter, smaller); it comes back as its turn comes.

   How far a waiting screen shrinks is --turn-waiting-scale, set here for the screens on the card:
   live-prototype.tsx scales by it, and a card that sets its screens side by side takes back the room
   the shrink opens between them, (1 − scale) / 2 of a screen's width (recipe-select-demo.tsx). */
const WAITING_SCALE = 0.9;

export default function PrototypeTurns({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // The page whose turn it is, and whether a change of turn fades: not the first, so a lightbox copy
  // starts out looking the way the card already does.
  const [turn, setTurn] = useState<{ index: number; fade: boolean } | null>(null);

  useEffect(() => {
    // Indexed in the order the pages take their turns, which is their order here.
    const lengths: number[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "proto:length") return;
      const frames = [...(ref.current?.querySelectorAll("iframe") ?? [])];
      const i = frames.findIndex((f) => f.contentWindow === e.source);
      if (i < 0) return;
      lengths[i] = e.data.length;
      if (frames.some((_, j) => lengths[j] === undefined)) return;
      const period = lengths.reduce((sum, length) => sum + length, 0);
      const offsets = lengths.map((_, j) => lengths.slice(0, j).reduce((sum, length) => sum + length, 0));
      frames.forEach((f, j) => {
        f.contentWindow?.postMessage({ type: "proto:turn", period, offset: offsets[j] }, window.location.origin);
      });
      // Follow the turns on the same clock, waking at each change of turn.
      clearTimeout(timer);
      const follow = () => {
        const t = Date.now() % period;
        let index = 0;
        while (index + 1 < offsets.length && t >= offsets[index + 1]) index++;
        setTurn((prev) => ({ index, fade: prev !== null }));
        timer = setTimeout(follow, (index + 1 < offsets.length ? offsets[index + 1] : period) - t);
      };
      follow();
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full h-full" style={{ "--turn-waiting-scale": WAITING_SCALE } as CSSProperties}>
      {Children.map(children, (child, j) => (
        <div
          className="absolute inset-0 pointer-events-none"
          data-turn-waiting={turn && turn.index !== j ? "" : undefined}
          data-turn-fade={turn?.fade ? "" : undefined}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
