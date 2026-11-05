import type { CSSProperties } from "react";
import CookScreenDemo from "./cook-screen-demo";
import PrototypeTurns from "./prototype-turns";
import QuickButtonDemo from "./quick-button-demo";

/* AlphaGrill's two ways to change recipes on one card: tapping one on the recipe sheet (the cook
   screen's "tap" scene) beside the quick recipe buttons on the cook screen itself, played by turns,
   the sheet first. Each 600×1024 screen keeps the size it had on a card of its own, 97cqh − 6.75cqw
   tall (85% of the 16:9 card's height, 88% of the 4:3 one's), and the pair is centred with a
   twelfth of that between them, or a sixteenth on the 4:3 card, where a twelfth left the pair
   loose: 0.75cqh + 3.5625cqw is the line through both. On the square phone card, where the line
   runs the pair off the card's sides, it's held to the width instead: 73% of the card's height
   with a sixteenth of that between, a twentieth of the card either side.
   Those gaps are what shows between the screen playing and the one waiting, which shrinks about its
   centre (prototype-turns.tsx): the frames sit closer by the room the shrink opens, (1 − scale) / 2
   of a screen's width. */
const HEIGHT = "(97cqh - 6.75cqw)";
const SHRINK_ROOM = (width: string) => `(1 - var(--turn-waiting-scale)) / 2 * ${width}`;
const GAP = `(0.75cqh + 3.5625cqw - ${SHRINK_ROOM(`${HEIGHT} * 600 / 1024`)})`;
const SCREEN: CSSProperties = { top: "50%", transform: "translateY(-50%)", height: `calc${HEIGHT}`, width: `calc(${HEIGHT} * 600 / 1024)` };
const SQUARE_HEIGHT = "73cqh";
const SQUARE_GAP = `(${SQUARE_HEIGHT} / 16 - ${SHRINK_ROOM(`${SQUARE_HEIGHT} * 600 / 1024`)})`;
const SQUARE_SCREEN: CSSProperties = { height: SQUARE_HEIGHT, width: `calc(${SQUARE_HEIGHT} * 600 / 1024)` };

export default function RecipeSelectDemo() {
  return (
    <PrototypeTurns>
      <CookScreenDemo
        scene="tap"
        turns
        frame={{ ...SCREEN, left: `calc(50% - ${GAP} / 2 - ${HEIGHT} * 600 / 1024)` }}
        squareFrame={{ ...SQUARE_SCREEN, left: `calc(50% - ${SQUARE_GAP} / 2 - ${SQUARE_HEIGHT} * 600 / 1024)` }}
      />
      <QuickButtonDemo
        turns
        frame={{ ...SCREEN, left: `calc(50% + ${GAP} / 2)` }}
        squareFrame={{ ...SQUARE_SCREEN, left: `calc(50% + ${SQUARE_GAP} / 2)` }}
      />
    </PrototypeTurns>
  );
}
