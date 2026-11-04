import type { CSSProperties } from "react";
import LivePrototype from "./live-prototype";

/* The firmware-generator prototype (public/prototypes/firmware-generator.html), pinned to dark mode
   whatever the site theme. Each scene's frame is placed on the 16:9 card and sized off the card's
   height, so the 4:3 card shows it a third larger, cropped at the sides. Create instead stacks
   its dialogs there, one at a time, in a frame of their own shape. */

const SCENES = {
  // "Edit": as large as Review's screen, the 16:9 card's full width (16/9 of its height), its top-left
  // corner set 12% in from the card's top and left edges. The card's right edge then cuts the screen
  // 88% of the way across, through the middle of the info panel (its last 320 of 1314px), and its
  // bottom edge leaves 88% of the card's height showing, 9/16 of the 1314px screen's width; `clip`
  // tells the page how much of its 820px screen is below that, so its scrolling list ends where the
  // card does. The 4:3 card keeps the corner and cuts the screen inside the editor instead.
  // On the square one the page lays the screen out 1088px across in place of 1314 (its .narrow),
  // the names' column brought in, so at the same height the screen sits 5% in from the card's left
  // edge with its names and the values being edited both in. Between takes it zooms out to the
  // wider cards' corner, 12% in from the card's top and left, at 118% of the card's width, the
  // least that still runs past its bottom edge, and back in for the next (the page says when). The
  // page drops `clip` there, as zoomed out the card cuts the screen lower down.
  edit: {
    frame: { top: "12%", left: "12%", height: `${(100 * 16 * 820) / (9 * 1314)}cqh`, width: `${(100 * 16) / 9}cqh` },
    squareFrame: { left: "5%", width: `${(100 * 16 * 1088) / (9 * 1314)}cqh` },
    squareZoomedOutFrame: {
      transform: `translateX(${12 - 5}cqw) scale(${118 / ((100 * 16 * 1088) / (9 * 1314))})`,
    },
    clip: 820 - 0.88 * ((9 / 16) * 1314),
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
  // "Create": the 1232×660 two-dialog composition, 83% of the card's height, centred (92% of its
  // width where that is less: 92 × 660/1232 = 49.2857cqw tall, 83 × 1232/660 = 154.9333cqh wide).
  // Below 640px, on the phone cards, 4:3 or square (and in the lightbox there too, so the two copies
  // agree), side by side the dialogs are too small to read (a 362px card draws them at 0.27×). The frame
  // takes the 600×660 shape of the stacked layout instead, which the page switches to as its box
  // narrows past 1.4:1, at 90% of the card's height (0.37×): 90 × 600/660 = 81.8182cqh wide, or
  // 92% of the width where that is less (92 × 660/600 = 101.2cqw tall). The box changes with the
  // viewport, so it's set in classes rather than the inline frame. The dialogs float on the card
  // itself, so the frame is bare: no outline or shadow of its own.
  create: {
    frame: {},
    frameClassName:
      "inset-0 m-auto h-[min(83cqh,49.2857cqw)] w-[min(154.9333cqh,92cqw)] max-sm:h-[min(90cqh,101.2cqw)] max-sm:w-[min(81.8182cqh,92cqw)]",
    bare: true,
  },
} satisfies Record<string, { frame: CSSProperties; frameClassName?: string; squareFrame?: CSSProperties; squareZoomedOutFrame?: CSSProperties; bare?: boolean; clip?: number }>;

export default function FirmwareGeneratorDemo({ scene = "edit" }: { scene?: keyof typeof SCENES }) {
  const config = SCENES[scene];
  const clip = "clip" in config ? `&clip=${config.clip.toFixed(2)}` : "";
  return (
    <LivePrototype
      src={`/prototypes/firmware-generator.html?embed&theme=dark&scene=${scene}${clip}`}
      scene={scene}
      title="Firmware generator prototype"
      frame={config.frame}
      frameClassName={"frameClassName" in config ? config.frameClassName : undefined}
      squareFrame={"squareFrame" in config ? config.squareFrame : undefined}
      squareZoomedOutFrame={"squareZoomedOutFrame" in config ? config.squareZoomedOutFrame : undefined}
      bare={"bare" in config}
    />
  );
}
