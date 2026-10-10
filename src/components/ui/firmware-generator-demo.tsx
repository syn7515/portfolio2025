import type { CSSProperties } from "react";
import LivePrototype from "./live-prototype";

/* The firmware-generator prototype (public/prototypes/firmware-generator.html), pinned to dark mode
   whatever the site theme. Each scene's frame sits where the media it replaces was drawn. */

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
  // picture in the 240%-tall box. This reproduces where it actually landed: full card width,
  // shifted left by 23.75%, its top at -45% + (240% height − picture height) / 2. That centres the
  // frame 75% down the card, so the card's bottom edge, a quarter of its height (9/16 of the 1314px
  // screen's width) below that middle, cuts off the rest of the 865px screen's lower half.
  build: {
    frame: { left: "-23.75%", width: "100cqw", height: `${(100 * 865) / 1314}cqw`, top: `calc(75cqh - ${(50 * 865) / 1314}cqw)` },
    clip: 865 / 2 - ((9 / 16) * 1314) / 4,
  },
  // "Create": the 1232×660 two-dialog composition, 83% of the card's height, centred. Its dialogs
  // float on the card itself, so the frame is bare: no outline or shadow of its own.
  create: { frame: { top: "50%", left: "50%", transform: "translate(-50%, -50%)", height: "83cqh", width: `${(83 * 1232) / 660}cqh` }, bare: true },
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
