import type { CSSProperties } from "react";
import LivePrototype from "./live-prototype";

/* AlphaGrill's cook screen (public/prototypes/alphagrill-cook.html): the v0-4 build the GRILL and
   CLEAN recordings were made from, replaying each recording's demo live. Each scene's 600×1024
   frame sits where its recording was drawn, with one change: the zoomed-in first cards show the
   whole screen on the 4:3 card. Where a frame takes one size and offset on the 16:9 card and another on
   the 4:3 one, it takes the line through both, a·cqh + b·cqw, which lands on each at its aspect.
   The square phone card, where that line runs on too far, takes a frame of its own. */
const SCREEN = 600 / 1024;

function screen(height: string, place: CSSProperties): CSSProperties {
  return { ...place, height: `calc(${height})`, width: `calc((${height}) * ${SCREEN})` };
}

// The first card of each carousel: the card's full height from 12% down, cropped at the bottom (the
// recordings were 135% from 8%); on the 4:3 card the whole screen, 88% of its height and centred,
// as the second card shows it.
const ZOOMED = screen("52cqh + 27cqw", { top: "calc(-12cqh + 13.5cqw)", left: "50%", transform: "translateX(-50%)" });
// The second: centred at 85% of the card's height (88% on mobile).
const WHOLE = screen("97cqh - 6.75cqw", { top: "50%", left: "50%", transform: "translate(-50%, -50%)" });

const SCENES = {
  gauge: ZOOMED, // grill-1: the gauge counts down to ready
  tap: WHOLE,    // grill-2: recipes picked from the sheet
  cool: ZOOMED,  // clean-1: a hot grill cooling toward the cleaning limit
  area: WHOLE,   // clean-2: cleaning areas picked on the controller
} satisfies Record<string, CSSProperties>;

// The square card shows the zoomed-in ones whole too, as the second card does; the line through
// 16:9 and 4:3 would run them past its bottom edge.
const SQUARE_SCENES: Partial<Record<keyof typeof SCENES, CSSProperties>> = {
  gauge: WHOLE,
  cool: WHOLE,
};

// On a card it shares (prototype-turns.tsx), `frame` and `squareFrame` place the screen elsewhere
// and `turns` has its take wait for its turn.
export default function CookScreenDemo({ scene, frame, squareFrame, turns = false }: { scene: keyof typeof SCENES; frame?: CSSProperties; squareFrame?: CSSProperties; turns?: boolean }) {
  return (
    <LivePrototype
      src={`/prototypes/alphagrill-cook.html?embed&scene=${scene}${turns ? "&turns" : ""}`}
      scene={scene}
      title="AlphaGrill cook screen prototype"
      frame={frame ?? SCENES[scene]}
      squareFrame={frame ? squareFrame : SQUARE_SCENES[scene]}
    />
  );
}
