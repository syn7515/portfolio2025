/* eslint-disable @next/next/no-img-element */
"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useLightboxDimensions,
  calculateImagePosition,
  type CarouselItem,
} from "./hooks";
import { GrillLines } from "./grill-lines";
import { renderCaptionWithBadges } from "@/components/ui/sup-caption-badge";
import { keepOnMainThread } from "@/lib/motion";

/* The nav buttons float over the backdrop, so their edge comes from the shadow's own hairline ring
   (smooth-shadow-ring) rather than a border or a blurred 1px layer standing in for one — a separate
   edge reads as a second, greyer line just outside the first. The light ring is tinted up from the
   plugin's 5% default: these sit on a near-white stone-100/85 backdrop, where 5% black leaves a
   white button barely detached from it. Dark mode keeps the plugin's white hairline. */
const NAV_BUTTON_MOTION_CLASS =
  "rounded-full p-2 sm:p-3 pointer-events-auto smooth-shadow-ring-sm smooth-ring-black/10 dark:smooth-ring-white/18 transition-[scale,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:enabled:active:scale-[0.97] motion-reduce:transition-[background-color]";

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
  isLgOrAbove: boolean;
  onExitComplete?: () => void;
  onContentReady?: () => void;
}

interface LightboxContentProps {
  currentItem: CarouselItem;
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

function LightboxContent({
  currentItem,
  initialTransform,
  exitTransform,
  exitDuration,
  isDarkMode,
  dimensions,
  onContentReady,
}: LightboxContentProps) {
  const hasPositionedImage = currentItem?.imageSizePercent != null && currentItem?.imageUrl;
  const hasPositionedVideo = currentItem?.imageSizePercent != null && currentItem?.videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const hasVideo = !!currentItem?.videoUrl;
  const withBackgroundLines = currentItem?.cardVariant === "with-background-lines";

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
  // Live markup that loads asynchronously (an iframe) marks itself data-content-pending until it
  // fires "contentready". Until then this copy stays transparent so the carousel card underneath
  // keeps showing, and the card only hides (onContentReady) in the same commit the copy appears.
  const isContentItem = !!currentItem?.content && !currentItem.imageUrl && !currentItem.videoUrl;
  const contentRef = useRef<HTMLDivElement>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  // Only the opening entrance holds for readiness; stepping to another card later must not snap the
  // box back to where the first card was.
  const hasEnteredRef = useRef(!isContentItem);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!isContentItem || !el) return;
    const markReady = () => {
      hasEnteredRef.current = true;
      setIsContentReady(true);
      onContentReady?.();
    };
    if (!el.querySelector("[data-content-pending]")) {
      markReady();
      return;
    }
    setIsContentReady(false);
    el.addEventListener("contentready", markReady);
    return () => el.removeEventListener("contentready", markReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContentItem, currentItem]);

  const motionProps = {
    initial: initialTransform ? toScale(initialTransform) : (false as const),
    // A pending live-content copy holds on the card until it's ready, so it takes over from the card
    // in exactly the card's place and only then grows into the lightbox.
    animate: isContentItem && !isContentReady && !hasEnteredRef.current && initialTransform
      ? toScale(initialTransform)
      : { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    exit: exitTransform ? toScale(exitTransform) : {},
    transition: {
      duration: exitTransform ? exitDuration : 0.4,
      ease: [0.77, 0, 0.175, 1] as const,
    },
    onAnimationComplete: () => setIsSettled(true),
  };
  const motionStyle: CSSProperties = {
    width: baseWidth,
    height: baseHeight,
    transformOrigin: 'center center',
    willChange: 'transform',
  };
  
  if (isContentItem) {
    // Live markup: laid out at the final 16:9 size like everything else, so its cqw/em sizing
    // resolves once against the lightbox box and the FLIP scale carries it to and from the card.
    return (
      <motion.div
        className="relative pointer-events-auto rounded-[4px]"
        {...motionProps}
        style={{ ...motionStyle, aspectRatio: '16/9', boxSizing: 'border-box' }}
      >
        <div
          ref={contentRef}
          data-lightbox-live=""
          className="absolute inset-0 overflow-hidden rounded-[4px]"
          style={{ backgroundColor: isDarkMode ? '#232326' : '#fafafa', opacity: isContentReady ? 1 : 0 }}
        >
          {currentItem.content}
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isContentReady ? 1 : 0,
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

  if (hasPositionedMedia) {
    // Positioned image or video mode with background layers
    return (
      <motion.div
        className="relative pointer-events-auto rounded-[4px]"
        {...motionProps}
        style={{
          ...motionStyle,
          aspectRatio: '16/9',
          boxSizing: 'border-box',
        }}
      >
        {/* overflow-hidden scoped to inner div so border overlay shadow is not clipped */}
        <div className="absolute inset-0 overflow-hidden rounded-[4px]">
          {withBackgroundLines ? (
            <>
              <div className="absolute inset-0 bg-stone-100 dark:bg-zinc-800" aria-hidden />
              {currentItem?.backgroundLines === "grill" && (
                <div className="absolute inset-0 pointer-events-none z-0 text-stone-300 dark:text-zinc-700" aria-hidden>
                  <GrillLines className="w-full h-full" />
                </div>
              )}
              {hasPositionedVideo && (
                <LightboxVideo
                  key={currentItem.videoUrl}
                  src={currentItem.videoUrl!}
                  poster={currentItem.imageUrl}
                  className="absolute object-contain z-[1]"
                  autoPlay={currentItem.videoAutoplay ?? true}
                  loop={currentItem.videoLoop ?? true}
                  muted={currentItem.videoMuted ?? true}
                  controls={currentItem.videoControls ?? false}
                  ariaLabel={currentItem.alt || currentItem.label || "Lightbox video"}
                  load={isSettled}
                  style={{
                    display: 'block',
                    transformOrigin: 'center center',
                    height: `${currentItem.imageSizePercent}%`,
                    width: 'auto',
                    ...calculateImagePosition(currentItem.imagePosition)
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
                  key={currentItem.videoUrl}
                  src={currentItem.videoUrl!}
                  poster={currentItem.imageUrl}
                  className="absolute object-contain"
                  autoPlay={currentItem.videoAutoplay ?? true}
                  loop={currentItem.videoLoop ?? true}
                  muted={currentItem.videoMuted ?? true}
                  controls={currentItem.videoControls ?? false}
                  ariaLabel={currentItem.alt || currentItem.label || "Lightbox video"}
                  load={isSettled}
                  style={{
                    display: 'block',
                    transformOrigin: 'center center',
                    height: `${currentItem.imageSizePercent}%`,
                    width: 'auto',
                    ...calculateImagePosition(currentItem.imagePosition),
                    ...(currentItem.withInsetShadow ? {
                      boxShadow: isDarkMode
                        ? 'inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.10), 0px 0px 0px 1px rgba(0,0,0,0.22), 0px 4px 8px rgba(0,0,0,0.30)'
                        : '0px 0px 0px 1px rgba(0,0,0,0.12), 0px 2px 3px -0.5px rgba(0,0,0,0.12), 0px 6px 6px -2px rgba(0,0,0,0.10)'
                    } : {})
                  }}
                />
              ) : (
                <img
                  src={currentItem.imageUrl ?? "/placeholder.svg"}
                  alt={currentItem.alt || currentItem.label || "Lightbox image"}
                  className="absolute object-contain"
                  style={{
                    opacity: 1,
                    display: 'block',
                    transformOrigin: 'center center',
                    height: `${currentItem.imageSizePercent}%`,
                    width: 'auto',
                    ...calculateImagePosition(currentItem.imagePosition),
                    ...(currentItem.withInsetShadow ? {
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
        {/* Border overlay outside overflow-hidden so shadow is not clipped */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
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
  } else {
    // Full-cover image or video mode
    return (
      <motion.div
        className="relative pointer-events-auto rounded-[4px]"
        {...motionProps}
        style={{
          ...motionStyle,
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* overflow-hidden scoped to inner div so border overlay shadow is not clipped */}
        <div className="absolute inset-0 overflow-hidden rounded-[4px]">
          {hasVideo ? (
            <LightboxVideo
              key={currentItem.videoUrl}
              src={currentItem.videoUrl!}
              poster={currentItem.imageUrl}
              className="absolute inset-0 object-contain w-full h-full"
              autoPlay={currentItem.videoAutoplay ?? true}
              loop={currentItem.videoLoop ?? true}
              muted={currentItem.videoMuted ?? true}
              controls={currentItem.videoControls ?? false}
              ariaLabel={currentItem.alt || currentItem.label || "Lightbox video"}
              load={isSettled}
              style={{ display: 'block', transformOrigin: 'center center' }}
            />
          ) : (
            <img
              src={currentItem?.imageUrl ?? "/placeholder.svg"}
              alt={currentItem?.alt || currentItem?.label || "Lightbox image"}
              className="object-contain w-full h-full"
              style={{ opacity: 1, display: 'block', transformOrigin: 'center center' }}
            />
          )}
        </div>
        {/* Border overlay outside overflow-hidden so shadow is not clipped */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
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
  isLgOrAbove,
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

  // The media itself is inert to clicks: live content inside it (a prototype) takes real hover and
  // shows its pressed states, so a click there must not also step or close. Stepping is the
  // prev/next buttons and the arrow keys; a click anywhere outside the media closes.
  const isOverMedia = (e: React.MouseEvent) =>
    Math.abs(e.clientX - window.innerWidth / 2) <= dimensions.width / 2 &&
    Math.abs(e.clientY - window.innerHeight / 2) <= dimensions.height / 2;

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
            animate={{ opacity: 1 }}
            style={{ willChange: 'opacity' }}
            exit={{ opacity: 0 }}
            transition={{
              duration: exitTransform ? exitDuration : 0.4,
              ease: [0.77, 0, 0.175, 1],
            }}
            className={`fixed inset-0 z-[70] cursor-zoom-out ${isDarkMode ? 'bg-black/70' : 'bg-stone-100/85'}`}
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
              {/* Relative container sizes to LightboxContent only */}
              <div className="relative">
                <LightboxContent
                  currentItem={normalizedItems[lightboxIndex]}
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
                const caption = normalizedItems[lightboxIndex]?.caption?.trim();
                if (!caption) return null;
                return (
                  <motion.div
                    className={`fixed left-0 right-0 text-center font-sans text-sm pointer-events-none ${isDarkMode ? '!text-white' : '!text-stone-600'}`}
                    style={{ top: `calc(50% + ${dimensions.height / 2}px + 1rem)` }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={
                      exitTransform
                        ? { opacity: 0, y: 4 }
                        : { opacity: 1, y: 0 }
                    }
                    transition={{
                      duration: exitTransform ? exitDuration : 0.4,
                      ease: [0.77, 0, 0.175, 1],
                    }}
                    onUpdate={keepOnMainThread}
                  >
                    {renderCaptionWithBadges(caption)}
                  </motion.div>
                );
              })()}

              {/* Prev/Next buttons - only when more than one item, and only from
                  LIGHTBOX_NAV_BREAKPOINT (820px) up: below it the media takes their room and the
                  arrow keys do the stepping. */}
              {!exitTransform && normalizedItems.length > 1 && (
                <>
                  <div
                    className="absolute z-20 pointer-events-none max-[820px]:hidden"
                    style={{
                      left: `calc(50% - ${dimensions.width / 2}px - ${isLgOrAbove ? 16 : 4}px)`,
                      top: '50%',
                      transform: 'translate(-100%, -50%)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                      onMouseEnter={() => setIsPrevHovered(true)}
                      onMouseLeave={() => setIsPrevHovered(false)}
                      disabled={isPrevDisabled}
                      className={`${NAV_BUTTON_MOTION_CLASS} ${isDarkMode ? 'text-white' : 'text-stone-700'} ${isPrevDisabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                      style={{
                        backgroundColor: isDarkMode
                          ? isPrevHovered && !isPrevDisabled ? '#202023' : '#18181b'
                          : isPrevHovered && !isPrevDisabled ? '#f4f4f4' : '#ffffff',
                      }}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" style={{ transform: 'translateX(-1.5px)' }} />
                    </button>
                  </div>
                  <div
                    className="absolute z-20 pointer-events-none max-[820px]:hidden"
                    style={{
                      left: `calc(50% + ${dimensions.width / 2}px + ${isLgOrAbove ? 16 : 4}px)`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                      onMouseEnter={() => setIsNextHovered(true)}
                      onMouseLeave={() => setIsNextHovered(false)}
                      disabled={isNextDisabled}
                      className={`${NAV_BUTTON_MOTION_CLASS} ${isDarkMode ? 'text-white' : 'text-stone-700'} ${isNextDisabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                      style={{
                        backgroundColor: isDarkMode
                          ? isNextHovered && !isNextDisabled ? '#202023' : '#18181b'
                          : isNextHovered && !isNextDisabled ? '#f4f4f4' : '#ffffff',
                      }}
                      aria-label="Next"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" style={{ transform: 'translateX(1.5px)' }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
