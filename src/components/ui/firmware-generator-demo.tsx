import type { CSSProperties } from "react";

/* Live firmware-generator prototype (public/prototypes/firmware-generator.html) in place of the
   screenshot + recording a carousel card used to show. The page is framed rather than ported so the
   card plays the exact prototype the videos were recorded from; it scales its 1314px-wide screen to
   whatever box it gets and is pinned to dark mode whatever the site theme. Each scene's frame sits
   where the media it replaces was drawn. */

const SCENES = {
  // "Edit": 98% of the card's height, centred, 12% from the top, cropped at the bottom.
  edit: { frame: { top: "12%", left: "50%", transform: "translateX(-50%)", height: "98cqh", width: `${(98 * 1314) / 820}cqh` } },
  // "Review": the old media asked for 240% height at top -45% / right 23.75%, but the global
  // `max-width: 100%` on img/video clamped it to the card's width and object-contain centred the
  // picture in the 240%-tall box. This reproduces where it actually landed: full card width,
  // shifted left by 23.75%, its top at -45% + (240% height − picture height) / 2.
  build: { frame: { left: "-23.75%", width: "100cqw", height: `${(100 * 865) / 1314}cqw`, top: `calc(75cqh - ${(50 * 865) / 1314}cqw)` } },
} satisfies Record<string, { frame: CSSProperties }>;

export default function FirmwareGeneratorDemo({ scene = "edit" }: { scene?: keyof typeof SCENES }) {
  const { frame } = SCENES[scene];
  return (
    <div className="relative w-full h-full overflow-hidden [container-type:size]" aria-hidden>
      <div
        className="absolute overflow-hidden shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.10),0px_3px_3px_-1.5px_rgba(0,0,0,0.10)] dark:shadow-[0px_2px_4px_rgba(0,0,0,0.25)]"
        style={frame}
      >
        <iframe
          src={`/prototypes/firmware-generator.html?embed&theme=dark&scene=${scene}`}
          title="Firmware generator prototype"
          loading="lazy"
          tabIndex={-1}
          className="block w-full h-full border-0 pointer-events-none"
          style={{ colorScheme: "normal" }}
        />
        {/* Outline drawn above the iframe: an inset shadow on the wrapper would sit under it. */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
      </div>
    </div>
  );
}
