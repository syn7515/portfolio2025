import type { CSSProperties } from "react";
import LivePrototype from "./live-prototype";

/* AlphaGrill's cook screen (public/prototypes/alphagrill-cook.html): the v0-4 build the GRILL and
   CLEAN recordings were made from, replaying each recording's demo live. Each scene's 600×1024
   frame sits where its recording was drawn, with one change: the zoomed-in first cards zoom in less
   on the 4:3 mobile card. Where a frame takes one size and offset on the 16:9 card and another on
   the 4:3 one, it takes the line through both, a·cqh + b·cqw, which lands on each at its aspect. */
const SCREEN = 600 / 1024;

function screen(height: string, place: CSSProperties): CSSProperties {
  return { ...place, height: `calc(${height})`, width: `calc((${height}) * ${SCREEN})` };
}

// The first card of each carousel: the card's full height from 12% down, cropped at the bottom;
// on mobile 115% from 10% (the recordings were 135% from 8%).
const ZOOMED = screen("160cqh - 33.75cqw", { top: "calc(4cqh + 4.5cqw)", left: "50%", transform: "translateX(-50%)" });
// The second: centred at 85% of the card's height (88% on mobile).
const WHOLE = screen("97cqh - 6.75cqw", { top: "50%", left: "50%", transform: "translate(-50%, -50%)" });

const SCENES = {
  gauge: ZOOMED, // grill-1: the gauge counts down to ready
  tap: WHOLE,    // grill-2: recipes picked from the sheet
  cool: ZOOMED,  // clean-1: a hot grill cooling toward the cleaning limit
  area: WHOLE,   // clean-2: cleaning areas picked on the controller
} satisfies Record<string, CSSProperties>;

// On a card it shares (recipe-select-demo.tsx), `frame` places the screen elsewhere and `turns` has
// its take wait for its turn.
export default function CookScreenDemo({ scene, frame, turns = false }: { scene: keyof typeof SCENES; frame?: CSSProperties; turns?: boolean }) {
  return (
    <LivePrototype
      src={`/prototypes/alphagrill-cook.html?embed&scene=${scene}${turns ? "&turns" : ""}`}
      scene={scene}
      title="AlphaGrill cook screen prototype"
      frame={frame ?? SCENES[scene]}
    />
  );
}
