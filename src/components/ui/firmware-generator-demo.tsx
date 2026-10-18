import type { CSSProperties } from "react";
import LivePrototype from "./live-prototype";

/* The firmware-generator prototype (public/prototypes/firmware-generator.html), pinned to dark mode
   whatever the site theme. Each scene's frame sits where the media it replaces was drawn on the 16:9
   card, sized off the card's height, so the 4:3 phone card shows it a third larger about the same
   point, cropped at the sides. Create alone is held to the card's width there. */

const SCENES = {
  // "Edit": 98% of the card's height, centred, 12% from the top, cropped at the bottom. The card cuts
  // off the bottom (12 + 98 − 100) / 98 of the frame; `clip` tells the page how much of its 820px
  // screen that is, so its scrolling list ends where the card does.
  edit: {
    frame: { top: "12%", left: "50%", transform: "translateX(-50%)", height: "98cqh", width: `${(98 * 1314) / 820}cqh` },
    clip: ((12 + 98 - 100) / 98) * 820,
  },
  // "Review": the old media asked for 240% height at top -45% / right 23.75%, but the global
  // `max-width: 100%` on img/video clamped it to the card's width and object-contain centred the
  // picture in the 240%-tall box. This reproduces where it actually landed: the 16:9 card's full
  // width (16/9 of its height), shifted left by 23.75% of that, its top at -45% + (240% height −
  // picture height) / 2. That centres the frame 75% down the card, so the card's bottom edge, a
  // quarter of its height (9/16 of the 1314px screen's width, at either aspect) below that middle,
  // cuts off the rest of the 865px screen's lower half.
  build: {
    frame: { top: "75%", left: "50%", transform: "translate(-73.75%, -50%)", height: `${(100 * 16 * 865) / (9 * 1314)}cqh`, width: `${(100 * 16) / 9}cqh` },
    clip: 865 / 2 - ((9 / 16) * 1314) / 4,
  },
  // "Create": the 1232×660 two-dialog composition, 83% of the card's height, centred — or 92% of its
  // width on the 4:3 card, where 83% of the height would crop both dialogs. They float on the card
  // itself, so the frame is bare: no outline or shadow of its own.
  create: {
    frame: { top: "50%", left: "50%", transform: "translate(-50%, -50%)", height: `min(83cqh, ${(92 * 660) / 1232}cqw)`, width: `min(${(83 * 1232) / 660}cqh, 92cqw)` },
    bare: true,
  },
} satisfies Record<string, { frame: CSSProperties; bare?: boolean; clip?: number }>;

export default function FirmwareGeneratorDemo({ scene = "edit" }: { scene?: keyof typeof SCENES }) {
  const config = SCENES[scene];
  const clip = "clip" in config ? `&clip=${config.clip.toFixed(2)}` : "";
  return (
    <LivePrototype
      src={`/prototypes/firmware-generator.html?embed&theme=dark&scene=${scene}${clip}`}
      scene={scene}
      title="Firmware generator prototype"
      frame={config.frame}
      bare={"bare" in config}
    />
  );
}
