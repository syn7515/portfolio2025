import type { CSSProperties } from "react";
import CookScreenDemo from "./cook-screen-demo";
import PrototypeTurns from "./prototype-turns";
import QuickButtonDemo from "./quick-button-demo";

/* AlphaGrill's two ways to change recipes on one card: tapping one on the recipe sheet (the cook
   screen's "tap" scene) beside the quick recipe buttons on the cook screen itself, played by turns,
   the sheet first. Each 600×1024 screen keeps the size it had on a card of its own, 97cqh − 6.75cqw
   tall (85% of the 16:9 card's height, 88% of the 4:3 mobile one's), and the pair is centred with a
   twelfth of that between them. */
const HEIGHT = "(97cqh - 6.75cqw)";
const GAP = `${HEIGHT} / 12`;
const SCREEN: CSSProperties = { top: "50%", transform: "translateY(-50%)", height: `calc${HEIGHT}`, width: `calc(${HEIGHT} * 600 / 1024)` };

export default function RecipeSelectDemo() {
  return (
    <PrototypeTurns>
      <CookScreenDemo scene="tap" turns frame={{ ...SCREEN, left: `calc(50% - ${GAP} / 2 - ${HEIGHT} * 600 / 1024)` }} />
      <QuickButtonDemo turns frame={{ ...SCREEN, left: `calc(50% + ${GAP} / 2)` }} />
    </PrototypeTurns>
  );
}
