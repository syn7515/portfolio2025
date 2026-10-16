"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import CookScreenDemo from "./cook-screen-demo";
import QuickButtonDemo from "./quick-button-demo";

/* AlphaGrill's two ways to change recipes on one card: tapping one on the recipe sheet (the cook
   screen's "tap" scene) beside the quick recipe buttons on the cook screen itself. Each 600×1024
   screen keeps the size it had on a card of its own, 97cqh − 6.75cqw tall (85% of the 16:9 card's
   height, 88% of the 4:3 mobile one's), and the pair is centred with a twelfth of that between them.
   Each page is framed into the whole card, one over the other, so both measure against the card;
   neither layer takes the pointer, which leaves the screens under it to their own iframes.

   The two take turns rather than playing at once: each page posts its take's length, and once both
   are in, each is told its turn in a cycle as long as the two together, the sheet first. Turns run
   on the wall clock, so the lightbox's copy of this card plays the same one as the card. */
const HEIGHT = "(97cqh - 6.75cqw)";
const GAP = `${HEIGHT} / 12`;
const SCREEN: CSSProperties = { top: "50%", transform: "translateY(-50%)", height: `calc${HEIGHT}`, width: `calc(${HEIGHT} * 600 / 1024)` };

export default function RecipeSelectDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Indexed in the order the pages take their turns, which is their order on the card.
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
      <div className="absolute inset-0 pointer-events-none">
        <CookScreenDemo scene="tap" turns frame={{ ...SCREEN, left: `calc(50% - ${GAP} / 2 - ${HEIGHT} * 600 / 1024)` }} />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <QuickButtonDemo turns frame={{ ...SCREEN, left: `calc(50% + ${GAP} / 2)` }} />
      </div>
    </div>
  );
}
