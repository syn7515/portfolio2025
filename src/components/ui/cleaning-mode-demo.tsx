import type { CSSProperties } from "react";
import CookScreenDemo from "./cook-screen-demo";
import PrototypeTurns from "./prototype-turns";

/* AlphaGrill's cleaning mode on one card, played by turns: the hot-grill guard (the cook screen's
   "cool" scene), then the cleaning areas picked on the controller ("area"). The two screens are
   staggered, the guard rising from the card's bottom edge on the left and the controller hanging
   from its top edge on the right, each cut where its screen is empty: the guard shows its top 88%,
   down past its "Clean anyway" link, and the controller its bottom 77.8%, from just under its
   gauge's top ticks (which end 224.5 down the 1024 screen, the grill ring's size). They're
   larger than the other cards' screens: 98% of the 16:9 card's height and 92% of the 4:3 mobile
   one's (74cqh + 13.5cqw is the line through both), with a twelfth of that between the two, as on
   the recipe card (recipe-select-demo.tsx). */
const HEIGHT = "(74cqh + 13.5cqw)";
const WIDTH = `${HEIGHT} * 600 / 1024`;
const GAP = `${HEIGHT} / 12`;
const SCREEN: CSSProperties = { height: `calc${HEIGHT}`, width: `calc(${WIDTH})` };

export default function CleaningModeDemo() {
  return (
    <PrototypeTurns>
      <CookScreenDemo scene="cool" turns frame={{ ...SCREEN, top: `calc(100% - ${HEIGHT} * 0.88)`, left: `calc(50% - ${GAP} / 2 - ${WIDTH})` }} />
      <CookScreenDemo scene="area" turns frame={{ ...SCREEN, top: `calc(${HEIGHT} * -0.222)`, left: `calc(50% + ${GAP} / 2)` }} />
    </PrototypeTurns>
  );
}
