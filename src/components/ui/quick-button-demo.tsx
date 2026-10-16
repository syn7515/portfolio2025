import type { CSSProperties } from "react";
import LivePrototype from "./live-prototype";

/* AlphaGrill's quick recipe select (public/prototypes/alphagrill-quick-button.html): the v14 quick
   button prototype in English, turning the setting off and on again from the menu. The 600×1024
   screen sits where the GRILL screen beside it does, centred at 85% of the card's height on the
   16:9 card and 88% on the 4:3 mobile one. 97cqh − 6.75cqw is that line through both aspects.
   On a card it shares (prototype-turns.tsx), `frame` places it elsewhere and `turns` has its
   take wait for its turn. */
const HEIGHT = "(97cqh - 6.75cqw)";

export default function QuickButtonDemo({ frame, turns = false }: { frame?: CSSProperties; turns?: boolean }) {
  return (
    <LivePrototype
      src={`/prototypes/alphagrill-quick-button.html?embed${turns ? "&turns" : ""}`}
      scene="quick-select"
      title="AlphaGrill quick recipe select prototype"
      frame={frame ?? { top: "50%", left: "50%", transform: "translate(-50%, -50%)", height: `calc${HEIGHT}`, width: `calc(${HEIGHT} * 600 / 1024)` }}
    />
  );
}
