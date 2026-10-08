"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* A live HTML prototype (a page under public/prototypes) framed into a carousel card in place of the
   screenshot or recording it replaces. The page is framed rather than ported so the card plays the
   exact prototype the videos were recorded from; it scales its screen to whatever box it gets.
   `frame` places that box where the replaced media was drawn; `bare` drops the outline and shadow
   for a page whose pieces sit on the card itself.

   A fresh iframe paints blank for a few frames before the page loads and catches up with its loop,
   so the frame stays invisible until the page posts "proto:ready" for this scene, with a skeleton
   in its place on the card meanwhile. The root carries
   data-content-pending until then and fires a bubbling "contentready" event, so a container (the
   lightbox) can keep showing what's underneath instead of flashing an empty box. */

export type LivePrototypeProps = {
  src: string;
  scene: string;
  title: string;
  frame: CSSProperties;
  bare?: boolean;
};

export default function LivePrototype({ src, scene, title, frame, bare = false }: LivePrototypeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Keyed to the page: the lightbox reuses this component when stepping between cards, and the
  // iframe navigating to another page is blank again until that one reports ready.
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const ready = readySrc === src;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type !== "proto:ready" || e.data.scene !== scene) return;
      setReadySrc(src);
      rootRef.current?.dispatchEvent(new Event("contentready", { bubbles: true }));
    };
    window.addEventListener("message", onMessage);
    // The page may have loaded and announced itself before this listener existed (it starts
    // loading from the server HTML, before hydration), so ask again; one that is showing replies.
    iframeRef.current?.contentWindow?.postMessage("proto:ping", window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [src, scene]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden [container-type:size]"
      data-content-pending={ready ? undefined : ""}
      aria-hidden
    >
      {/* The loading skeleton image and video cards show (.media-skeleton in globals.css), in the
          frame's own box; the frame fades in over it once the page is ready. Card only: a lightbox
          copy stays wholly transparent until ready and then has to stand in for the card in one
          frame, so there it gets neither the skeleton nor the fade. */}
      <div
        data-shown={ready ? "" : undefined}
        className="media-skeleton transition-opacity duration-300 ease-[ease-out] [[data-lightbox-live]_&]:hidden"
        style={{ ...frame, opacity: ready ? 0 : 1 }}
      />
      <div
        className={`absolute overflow-hidden transition-opacity duration-300 ease-[ease-out] [[data-lightbox-live]_&]:transition-none ${bare ? "" : "shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.10),0px_3px_3px_-1.5px_rgba(0,0,0,0.10)] dark:shadow-[0px_2px_4px_rgba(0,0,0,0.25)]"}`}
        style={{ ...frame, opacity: ready ? 1 : 0 }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          // Inert on the carousel card (a click there opens the lightbox); in the lightbox it takes
          // real hover and press, which the page shows but doesn't act on.
          className="block w-full h-full border-0 pointer-events-none [[data-lightbox-live]_&]:pointer-events-auto"
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
