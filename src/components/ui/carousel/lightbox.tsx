/* eslint-disable @next/next/no-img-element */
"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useLightboxDimensions,
  calculateImagePosition,
  LIGHTBOX_CAPTION_GAP,
  LIGHTBOX_MEDIA_LIFT,
  LIGHTBOX_NAV_BOTTOM,
  type CarouselItem,
} from "./hooks";
import { GrillLines } from "./grill-lines";
import { renderCaptionWithBadges } from "@/components/ui/sup-caption-badge";
import { DescriptionBackdrop } from "@/components/ui/description-backdrop";
import { keepOnMainThread } from "@/lib/motion";

/* The nav buttons float over the backdrop, so their edge comes from the shadow's own hairline ring
   (smooth-shadow-ring) rather than a border or a blurred 1px layer standing in for one — a separate
   edge reads as a second, greyer line just outside the first. The light ring is tinted up from the
   plugin's 5% default: these sit on a near-white stone-100/90 backdrop, where 5% black leaves a
   white button barely detached from it. Dark mode keeps the plugin's white hairline. A disabled
   button mutes its ring along with its fill and icon (navButtonColors). */
const NAV_BUTTON_MOTION_CLASS =
  "rounded-full p-2.5 pointer-events-auto smooth-shadow-ring-sm smooth-ring-black/10 dark:smooth-ring-white/18 disabled:smooth-ring-black/5 dark:disabled:smooth-ring-white/8 transition-[scale,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:enabled:active:scale-[0.97] motion-reduce:transition-[background-color,color]";

/* Disabled is a solid fill and icon colour rather than a fade: a faded button let the page behind
   the backdrop show through it. The solids are the tones that 40% fade landed on over each
   backdrop, so the disabled button reads the same, just opaque. */
function navButtonColors(isDarkMode: boolean, isDisabled: boolean, isHovered: boolean): CSSProperties {
  if (isDarkMode) {
    return isDisabled
      ? { backgroundColor: '#0e0e10', color: '#6e6e6f' }
      : { backgroundColor: isHovered ? '#202023' : '#18181b', color: '#ffffff' };
  }
  return isDisabled
    ? { backgroundColor: '#fafaf9', color: '#b1b0ad' }
    : { backgroundColor: isHovered ? '#f4f4f4' : '#ffffff', color: '#44403c' };
}

export type TransformSnapshot = {
  x: number;
  y: number;
  width: number;
  height: number;
  finalWidth: number;
  finalHeight: number;
};

interface LightboxProps {
  presenceKey: number;
  isOpen: boolean;
  closeLightbox: () => void;
  prevLightbox: () => void;
  nextLightbox: () => void;
  lightboxIndex: number;
  normalizedItems: CarouselItem[];
  initialTransform: TransformSnapshot | null;
  exitTransform: TransformSnapshot | null;
  exitDuration: number;
  isDarkMode: boolean;
  onExitComplete?: () => void;
  onContentReady?: () => void;
}

/** The item the box has on show, and whether it's ready or standing in as its loading skeleton. */
type ShownLayer = { index: number; ready: boolean };

interface LightboxContentProps {
  items: CarouselItem[];
  index: number;
  shown: ShownLayer | null;
  onShow: (index: number, ready: boolean) => void;
  initialTransform: TransformSnapshot | null;
  exitTransform: TransformSnapshot | null;
  exitDuration: number;
  isDarkMode: boolean;
  dimensions: { width: number; height: number };
  onContentReady?: () => void;
}

interface LightboxVideoProps {
  src: string;
  poster?: string | null;
  className: string;
  style: CSSProperties;
  autoPlay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  ariaLabel: string;
  /** False while the open animation runs: the video stays unloaded (poster only) until it settles. */
  load: boolean;
}

function LightboxVideo({
  src,
  poster,
  className,
  style,
  autoPlay,
  loop,
  muted,
  controls,
  ariaLabel,
  load,
}: LightboxVideoProps) {
  const [isReady, setIsReady] = useState(false);

  return (
    <>
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden
          className={className}
          fetchPriority="high"
          style={{
            ...style,
            opacity: isReady ? 0 : 1,
            pointerEvents: 'none',
          }}
        />
      )}
      <video
        src={load ? src : undefined}
        poster={poster ?? undefined}
        className={className}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        preload="auto"
        aria-label={ariaLabel}
        onLoadedData={() => setIsReady(true)}
        onCanPlay={() => setIsReady(true)}
        style={{
          ...style,
          opacity: isReady ? 1 : 0,
          pointerEvents: isReady ? 'auto' : 'none',
        }}
      />
    </>
  );
}

// A live page counts as one when it's markup rather than an image or a video.
const isLiveContent = (item: CarouselItem) => !!item.content && !item.imageUrl && !item.videoUrl;

// How long a step holds the item before while a live page loads, before showing its skeleton.
const SKELETON_AFTER_MS = 150;

// How long the box rests with nothing loading before it loads a neighbouring item, unseen.
const PRELOAD_AFTER_MS = 250;

interface MediaLayerProps {
  index: number;
  item: CarouselItem;
  isDarkMode: boolean;
  /** On show before it's ready: a live page shows its loading skeleton (LivePrototype). */
  waiting: boolean;
  /** False while the open animation runs: a video stays unloaded (poster only) until it settles. */
  load: boolean;
  onReady: (index: number) => void;
}

/* One item's media inside the lightbox box: a live page, a positioned image or video over its card
   background, or a full-cover one. It reports ready once it has something to show — a live page
   when it fires "contentready", an image or a video's poster once it has loaded (or failed) — so
   the box can keep the item before it on show until then. */
function MediaLayer({ index, item, isDarkMode, waiting, load, onReady }: MediaLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isContentItem = isLiveContent(item);
  const hasPositionedImage = item.imageSizePercent != null && item.imageUrl;
  const hasPositionedVideo = item.imageSizePercent != null && item.videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const hasVideo = !!item.videoUrl;
  const withBackgroundLines = item.cardVariant === "with-background-lines";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ready = () => onReady(index);
    if (isContentItem) {
      // Live markup that loads asynchronously (an iframe) marks itself data-content-pending until
      // it fires "contentready".
      if (!el.querySelector("[data-content-pending]")) {
        ready();
        return;
      }
      el.addEventListener("contentready", ready);
      return () => el.removeEventListener("contentready", ready);
    }
    const img = el.querySelector("img");
    if (!img || img.complete) {
      ready();
      return;
    }
    img.addEventListener("load", ready);
    img.addEventListener("error", ready);
    return () => {
      img.removeEventListener("load", ready);
      img.removeEventListener("error", ready);
    };
  }, [index, isContentItem, onReady]);

  if (isContentItem) {
    // Live markup: laid out at the final 16:9 size like everything else, so its cqw/em sizing
    // resolves once against the lightbox box and the FLIP scale carries it to and from the card.
    return (
      <div
        ref={ref}
        data-lightbox-live=""
        data-lightbox-waiting={waiting ? "" : undefined}
        className="absolute inset-0 overflow-hidden rounded-[4px]"
        style={{ backgroundColor: isDarkMode ? '#232326' : '#fafafa' }}
      >
        {item.content}
      </div>
    );
  }

  if (hasPositionedMedia) {
    // Positioned image or video mode with background layers
    return (
      <div ref={ref} className="absolute inset-0 overflow-hidden rounded-[4px]">
        {withBackgroundLines ? (
          <>
            <div className="absolute inset-0 bg-stone-100 dark:bg-zinc-800" aria-hidden />
            {item.backgroundLines === "grill" && (
              <div className="absolute inset-0 pointer-events-none z-0 text-stone-300 dark:text-zinc-700" aria-hidden>
                <GrillLines className="w-full h-full" />
              </div>
            )}
            {hasPositionedVideo && (
              <LightboxVideo
                src={item.videoUrl!}
                poster={item.imageUrl}
                className="absolute object-contain z-[1]"
                autoPlay={item.videoAutoplay ?? true}
                loop={item.videoLoop ?? true}
                muted={item.videoMuted ?? true}
                controls={item.videoControls ?? false}
                ariaLabel={item.alt || item.label || "Lightbox video"}
                load={load}
                style={{
                  display: 'block',
                  transformOrigin: 'center center',
                  height: `${item.imageSizePercent}%`,
                  width: 'auto',
                  ...calculateImagePosition(item.imagePosition)
                }}
              />
            )}
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: isDarkMode ? '#232326' : '#fafafa' }}
            />
            {hasPositionedVideo ? (
              <LightboxVideo
                src={item.videoUrl!}
                poster={item.imageUrl}
                className="absolute object-contain"
                autoPlay={item.videoAutoplay ?? true}
                loop={item.videoLoop ?? true}
                muted={item.videoMuted ?? true}
                controls={item.videoControls ?? false}
                ariaLabel={item.alt || item.label || "Lightbox video"}
                load={load}
                style={{
                  display: 'block',
                  transformOrigin: 'center center',
                  height: `${item.imageSizePercent}%`,
                  width: 'auto',
                  ...calculateImagePosition(item.imagePosition),
                  ...(item.withInsetShadow ? {
                    boxShadow: isDarkMode
                      ? 'inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.10), 0px 0px 0px 1px rgba(0,0,0,0.22), 0px 4px 8px rgba(0,0,0,0.30)'
                      : '0px 0px 0px 1px rgba(0,0,0,0.12), 0px 2px 3px -0.5px rgba(0,0,0,0.12), 0px 6px 6px -2px rgba(0,0,0,0.10)'
                  } : {})
                }}
              />
            ) : (
              <img
                src={item.imageUrl ?? "/placeholder.svg"}
                alt={item.alt || item.label || "Lightbox image"}
                className="absolute object-contain"
                style={{
                  opacity: 1,
                  display: 'block',
                  transformOrigin: 'center center',
                  height: `${item.imageSizePercent}%`,
                  width: 'auto',
                  ...calculateImagePosition(item.imagePosition),
                  ...(item.withInsetShadow ? {
                    boxShadow: isDarkMode
                      ? 'inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.10), 0px 0px 0px 1px rgba(0,0,0,0.22), 0px 4px 8px rgba(0,0,0,0.30)'
                      : '0px 0px 0px 1px rgba(0,0,0,0.12), 0px 2px 3px -0.5px rgba(0,0,0,0.12), 0px 6px 6px -2px rgba(0,0,0,0.10)'
                  } : {})
                }}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Full-cover image or video mode
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden rounded-[4px]">
      {hasVideo ? (
        <LightboxVideo
          src={item.videoUrl!}
          poster={item.imageUrl}
          className="absolute inset-0 object-contain w-full h-full"
          autoPlay={item.videoAutoplay ?? true}
          loop={item.videoLoop ?? true}
          muted={item.videoMuted ?? true}
          controls={item.videoControls ?? false}
          ariaLabel={item.alt || item.label || "Lightbox video"}
          load={load}
          style={{ display: 'block', transformOrigin: 'center center' }}
        />
      ) : (
        <img
          src={item.imageUrl ?? "/placeholder.svg"}
          alt={item.alt || item.label || "Lightbox image"}
          className="object-contain w-full h-full"
          style={{ opacity: 1, display: 'block', transformOrigin: 'center center' }}
        />
      )}
    </div>
  );
}

function LightboxContent({
  items,
  index,
  shown,
  onShow,
  initialTransform,
  exitTransform,
  exitDuration,
  isDarkMode,
  dimensions,
  onContentReady,
}: LightboxContentProps) {
  // FLIP: the box is laid out once at its final size and only x/y/scale animate, so the open/close
  // runs on the compositor instead of re-laying-out, re-clipping and re-painting the media and its
  // shadows every frame the way a width/height tween does.
  // The box is always the 16:9 lightbox frame, so the size it opens to is the size it stays at —
  // no second resize once the entrance finishes.
  const baseWidth = dimensions.width;
  const baseHeight = dimensions.height;
  // Fetching and decoding a video competes with the open animation, so it waits for it to settle.
  const [isSettled, setIsSettled] = useState(!initialTransform);
  const toScale = (t: TransformSnapshot) => ({
    x: t.x,
    y: t.y,
    scaleX: t.width / baseWidth,
    scaleY: t.height / baseHeight,
  });
  // The box stays put while the lightbox steps between items; only what's in it changes. The item
  // on show (`shown`, kept by Lightbox so the caption follows it) stays until the next one has
  // something to show, and only then gives way, so a step never leaves the box empty or replays the
  // entrance. A live page that takes longer than SKELETON_AFTER_MS takes over sooner, as its loading
  // skeleton, rather than holding the item before for long. Until the first item is ready the box
  // isn't shown at all: it holds on its card, which keeps showing underneath (a live copy can take a
  // few frames to load), and the card only hides (onContentReady) once the box can stand in.
  const shownIndex = shown?.index ?? null;
  const hasEntered = shown !== null;
  const readyIndex = shown?.ready ? shown.index : null;
  useEffect(() => {
    if (readyIndex !== null) onContentReady?.();
  }, [readyIndex, onContentReady]);

  // Every item the box has loaded this opening stays loaded (a carousel holds a handful), so a step
  // back is as quick as a step on. Once the entrance has settled and nothing is loading, the box
  // loads the next item along, unseen, then the one before: a step to it then swaps at once, with
  // no load competing with it. The item stepped to always loads, preloaded or not.
  const [loaded, setLoaded] = useState<number[]>([index]);
  const [readyLayers, setReadyLayers] = useState<number[]>([]);
  const markReady = useCallback((i: number) => setReadyLayers((r) => (r.includes(i) ? r : [...r, i])), []);
  // Recorded as the render that steps to it runs (React's way for state that follows a prop), so the
  // item's layer is in the same render.
  if (!loaded.includes(index)) setLoaded([...loaded, index]);
  const layers = loaded;
  const isLoading = layers.some((i) => !readyLayers.includes(i));
  useEffect(() => {
    if (!isSettled || isLoading) return;
    const neighbour = [index + 1, index - 1].find((i) => i >= 0 && i < items.length && !loaded.includes(i));
    if (neighbour === undefined) return;
    const timer = window.setTimeout(
      () => setLoaded((l) => (l.includes(neighbour) ? l : [...l, neighbour])),
      PRELOAD_AFTER_MS
    );
    return () => window.clearTimeout(timer);
  }, [isSettled, isLoading, index, items.length, loaded]);

  // The item stepped to goes on show as soon as it's ready — in the same frame, if it was preloaded
  // — and the caption with it (a layout effect, so both land before the frame paints).
  const currentReady = readyLayers.includes(index);
  const isShowingCurrent = shownIndex === index && !!shown?.ready;
  useLayoutEffect(() => {
    if (currentReady && !isShowingCurrent) onShow(index, true);
  }, [currentReady, isShowingCurrent, index, onShow]);
  const steppingToLive = shownIndex !== null && shownIndex !== index && !currentReady && isLiveContent(items[index]);
  useEffect(() => {
    if (!steppingToLive) return;
    const timer = window.setTimeout(() => onShow(index, false), SKELETON_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [steppingToLive, index, onShow]);

  // A live page keeps redrawing (its loop plays on) while the box shrinks back onto its card, and
  // every redraw re-rasters the scaled frame mid-close. The copy is on its way out, so it's asked to
  // hold still ("proto:pause"); a page that doesn't listen carries on as before.
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exitTransform) return;
    boxRef.current?.querySelectorAll("iframe").forEach((frame) => {
      frame.contentWindow?.postMessage("proto:pause", window.location.origin);
    });
  }, [exitTransform]);

  return (
    <motion.div
      ref={boxRef}
      className="relative pointer-events-auto rounded-[4px]"
      initial={initialTransform ? toScale(initialTransform) : false}
      animate={!hasEntered && initialTransform ? toScale(initialTransform) : { x: 0, y: 0, scaleX: 1, scaleY: 1 }}
      exit={exitTransform ? toScale(exitTransform) : {}}
      transition={{
        duration: exitTransform ? exitDuration : 0.4,
        ease: [0.77, 0, 0.175, 1] as const,
      }}
      onAnimationComplete={() => setIsSettled(true)}
      style={{
        width: baseWidth,
        height: baseHeight,
        transformOrigin: 'center center',
        willChange: 'transform',
        aspectRatio: '16/9',
        boxSizing: 'border-box',
      }}
    >
      {/* Only the item on show is seen; the one stepped to sits over it until it's ready, and
          preloaded ones wait under both. */}
      {layers.map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === shownIndex ? 1 : 0,
            zIndex: i === index ? 1 : 0,
            pointerEvents: i === shownIndex ? undefined : 'none',
          }}
          aria-hidden={i === shownIndex ? undefined : true}
        >
          <MediaLayer
            index={i}
            item={items[i]}
            isDarkMode={isDarkMode}
            waiting={i === shownIndex && !shown?.ready}
            load={isSettled}
            onReady={markReady}
          />
        </div>
      ))}
      {/* Border overlay above the media, so its shadow is not clipped */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: hasEntered ? 1 : 0,
          boxShadow: isDarkMode
            ? 'inset 0 1px 0 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.03), 0px 4px 12px rgba(0,0,0,0.4)'
            : '0px 0px 1px 0px rgba(0,0,0,0.4), 0px 4px 8px 0px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
          borderRadius: '4px',
          zIndex: 10,
        }}
      />
    </motion.div>
  );
}

export function Lightbox({
  presenceKey,
  isOpen,
  closeLightbox,
  prevLightbox,
  nextLightbox,
  lightboxIndex,
  normalizedItems,
  initialTransform,
  exitTransform,
  exitDuration,
  isDarkMode,
  onExitComplete,
  onContentReady,
}: LightboxProps) {
  const dimensions = useLightboxDimensions();
  const isPrevDisabled = lightboxIndex === 0;
  const isNextDisabled = lightboxIndex >= normalizedItems.length - 1;
  // Written straight to the DOM: the cursor changes on mousemove, which shouldn't re-render the lightbox
  const hitAreaRef = useRef<HTMLDivElement>(null);
  const setCursorStyle = (cursor: string) => {
    if (hitAreaRef.current && hitAreaRef.current.style.cursor !== cursor) {
      hitAreaRef.current.style.cursor = cursor;
    }
  };
  const [isPrevHovered, setIsPrevHovered] = useState(false);
  const [isNextHovered, setIsNextHovered] = useState(false);
  // What the box has on show (LightboxContent), kept here so the caption changes with it rather
  // than ahead of it. It belongs to one opening — each opening brings a new initialTransform, and
  // each close moves presenceKey on — so a value from an earlier one is left behind without an
  // effect to clear it, even if the lightbox reopens before its close has finished.
  const [shownState, setShownState] = useState<
    (ShownLayer & { presenceKey: number; from: TransformSnapshot | null }) | null
  >(null);
  const shown = shownState?.presenceKey === presenceKey && shownState.from === initialTransform ? shownState : null;
  const showLayer = useCallback(
    (index: number, ready: boolean) => setShownState({ presenceKey, from: initialTransform, index, ready }),
    [presenceKey, initialTransform]
  );
  const captionIndex = shown?.index ?? lightboxIndex;

  // The media itself is inert to clicks: live content inside it (a prototype) takes real hover and
  // shows its pressed states, so a click there must not also step or close. Stepping is the
  // prev/next buttons and the arrow keys; a click anywhere outside the media closes.
  const isOverMedia = (e: React.MouseEvent) =>
    Math.abs(e.clientX - window.innerWidth / 2) <= dimensions.width / 2 &&
    Math.abs(e.clientY - (window.innerHeight / 2 - LIGHTBOX_MEDIA_LIFT)) <= dimensions.height / 2;
  // The caption hangs off the media's bottom edge.
  const captionTop = `calc(50% - ${LIGHTBOX_MEDIA_LIFT}px + ${dimensions.height / 2}px + ${LIGHTBOX_CAPTION_GAP}px)`;
  // The caption and the buttons drift in under the media as it opens and fade out as it closes.
  // The box holds on its card until its item is ready (a live copy takes a few frames to load), so
  // the backdrop, the caption and the buttons wait for it too and set off with the box: a backdrop
  // fading in over a card that hasn't moved yet read as a blink before the open.
  const hasEntered = shown !== null;
  const belowMediaMotion = {
    initial: { opacity: 0, y: 4 },
    animate: exitTransform || !hasEntered ? { opacity: 0, y: 4 } : { opacity: 1, y: 0 },
    transition: {
      duration: exitTransform ? exitDuration : 0.4,
      ease: [0.77, 0, 0.175, 1] as const,
    },
    onUpdate: keepOnMainThread,
  };

  const handleMouseMove = (e: React.MouseEvent) => setCursorStyle(isOverMedia(e) ? 'default' : 'zoom-out');

  const handleMouseLeave = () => setCursorStyle('zoom-out');

  const handleClick = (e: React.MouseEvent) => {
    if (!isOverMedia(e)) closeLightbox();
  };

  return (
    <AnimatePresence
      key={presenceKey}
      initial={false}
      onExitComplete={onExitComplete}
    >
      {isOpen && (
        <div key="lightbox-layer">
          {/* Background overlay with opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hasEntered ? 1 : 0 }}
            style={{ willChange: 'opacity' }}
            exit={{ opacity: 0 }}
            transition={{
              duration: exitTransform ? exitDuration : 0.4,
              ease: [0.77, 0, 0.175, 1],
            }}
            className={`fixed inset-0 z-[70] cursor-zoom-out ${isDarkMode ? 'bg-black/80' : 'bg-stone-100/90'}`}
            onClick={closeLightbox}
            // Without it the backdrop blinks out as it lands and back in as it leaves — see
            // keepOnMainThread.
            onUpdate={keepOnMainThread}
          />

          {/* Lightbox content container */}
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            initial={false}
          >
            {/* Image container - positioned absolutely to allow animation without clipping */}
            <div
              ref={hitAreaRef}
              className="absolute inset-0 pointer-events-auto flex items-center justify-center"
              style={{ overflow: 'visible', cursor: 'default' }}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Relative container sizes to LightboxContent only, lifted off centre to leave room
                  for the caption and buttons under it. z-10 keeps the media above the caption's
                  backdrop, whose wash reaches up past the 1rem gap into the media's bottom edge;
                  the caption comes later in the DOM and would otherwise paint over it. */}
              <div className="relative z-10" style={{ top: -LIGHTBOX_MEDIA_LIFT }}>
                <LightboxContent
                  items={normalizedItems}
                  index={lightboxIndex}
                  shown={shown}
                  onShow={showLayer}
                  initialTransform={initialTransform}
                  exitTransform={exitTransform}
                  exitDuration={exitDuration}
                  isDarkMode={isDarkMode}
                  dimensions={dimensions}
                  onContentReady={onContentReady}
                />
              </div>

              {/* Caption - fixed relative to viewport so it doesn't move during the open/close animation */}
              {(() => {
                const caption = normalizedItems[captionIndex]?.caption?.trim();
                if (!caption) return null;
                return (
                  <motion.div
                    className={`fixed left-0 right-0 text-center font-sans text-sm pointer-events-none ${isDarkMode ? '!text-white' : '!text-stone-600'}`}
                    style={{ top: captionTop }}
                    {...belowMediaMotion}
                  >
                    {/* The backdrop hugs the text, so it wraps an inline box rather than spanning
                        the full-width row; it fades and drifts with the caption it backs. */}
                    <span className="relative isolate inline-block">
                      <DescriptionBackdrop />
                      <span className="relative z-10">{renderCaptionWithBadges(caption)}</span>
                    </span>
                  </motion.div>
                );
              })()}

              {/* Prev/Next buttons - only when more than one item. They sit side by side, floated
                  just off the viewport's bottom edge (LIGHTBOX_NAV_BOTTOM). The pair swallows its
                  own clicks, so a press that lands in the gap between the two doesn't fall through
                  to the backdrop and close the lightbox. */}
              {normalizedItems.length > 1 && (
                <motion.div
                  className="fixed left-0 right-0 z-20 flex justify-center pointer-events-none"
                  style={{ bottom: LIGHTBOX_NAV_BOTTOM }}
                  inert={!!exitTransform}
                  {...belowMediaMotion}
                >
                  <div
                    className="flex gap-2 pointer-events-auto cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                      onMouseEnter={() => setIsPrevHovered(true)}
                      onMouseLeave={() => setIsPrevHovered(false)}
                      disabled={isPrevDisabled}
                      className={`${NAV_BUTTON_MOTION_CLASS} ${isPrevDisabled ? 'cursor-default' : 'cursor-pointer'}`}
                      style={navButtonColors(isDarkMode, isPrevDisabled, isPrevHovered)}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-5 h-5" style={{ transform: 'translateX(-1.25px)' }} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                      onMouseEnter={() => setIsNextHovered(true)}
                      onMouseLeave={() => setIsNextHovered(false)}
                      disabled={isNextDisabled}
                      className={`${NAV_BUTTON_MOTION_CLASS} ${isNextDisabled ? 'cursor-default' : 'cursor-pointer'}`}
                      style={navButtonColors(isDarkMode, isNextDisabled, isNextHovered)}
                      aria-label="Next"
                    >
                      <ChevronRight className="w-5 h-5" style={{ transform: 'translateX(1.25px)' }} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
