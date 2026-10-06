"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

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
  // "Create": the 1232×660 two-dialog composition, 83% of the card's height, centred. Its dialogs
  // float on the card itself, so the frame is bare: no outline or shadow of its own.
  create: { frame: { top: "50%", left: "50%", transform: "translate(-50%, -50%)", height: "83cqh", width: `${(83 * 1232) / 660}cqh` }, bare: true },
} satisfies Record<string, { frame: CSSProperties; bare?: boolean }>;

// A fresh iframe paints blank for a few frames before the page loads and catches up with the loop,
// so the frame stays invisible until the page posts "fwproto:ready" for this scene. The root carries
// data-content-pending until then and fires a bubbling "contentready" event, so a container (the
// lightbox) can keep showing what's underneath instead of flashing an empty box.
export default function FirmwareGeneratorDemo({ scene = "edit" }: { scene?: keyof typeof SCENES }) {
  const { frame } = SCENES[scene];
  const bare = "bare" in SCENES[scene];
  const rootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Keyed to the scene: the lightbox reuses this component when stepping between cards, and the
  // iframe navigating to another scene is blank again until that page reports ready.
  const [readyScene, setReadyScene] = useState<string | null>(null);
  const ready = readyScene === scene;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type !== "fwproto:ready" || e.data.scene !== scene) return;
      setReadyScene(scene);
      rootRef.current?.dispatchEvent(new Event("contentready", { bubbles: true }));
    };
    window.addEventListener("message", onMessage);
    // The page may have loaded and announced itself before this listener existed (it starts
    // loading from the server HTML, before hydration), so ask again; one that is showing replies.
    iframeRef.current?.contentWindow?.postMessage("fwproto:ping", window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [scene]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden [container-type:size]"
      data-content-pending={ready ? undefined : ""}
      aria-hidden
    >
      <div
        className={`absolute overflow-hidden${bare ? "" : " shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.10),0px_3px_3px_-1.5px_rgba(0,0,0,0.10)] dark:shadow-[0px_2px_4px_rgba(0,0,0,0.25)]"}`}
        style={{ ...frame, opacity: ready ? 1 : 0 }}
      >
        <iframe
          ref={iframeRef}
          src={`/prototypes/firmware-generator.html?embed&theme=dark&scene=${scene}`}
          title="Firmware generator prototype"
          loading="lazy"
          tabIndex={-1}
          className="block w-full h-full border-0 pointer-events-none"
          // The site's <meta name="color-scheme" content="light dark"> makes a "normal" iframe count
          // as dark in dark mode, while the page inside declares nothing and counts as light. When
          // the two differ the browser paints the iframe opaque white, so pin it to light to match.
          style={{ colorScheme: "light" }}
        />
        {/* Outline drawn above the iframe: an inset shadow on the wrapper would sit under it. */}
        {!bare && (
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
        )}
      </div>
    </div>
  );
}
