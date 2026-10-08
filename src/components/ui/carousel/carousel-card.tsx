/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { motion, type Transition } from "framer-motion";
import { calculateImagePosition, useIsCompact, useNearViewport, type CarouselItem } from "./hooks";
import { GrillLines } from "./grill-lines";
import { CARD_LIGHT_SHADOW } from "@/components/ui/card-shadow";
import { renderCaptionWithBadges } from "@/components/ui/sup-caption-badge";

// How long carousel media takes to fade in over its skeleton once something is on screen.
const MEDIA_REVEAL_MS = 300;

interface CarouselCardProps {
  item: CarouselItem;
  index: number;
  currentIndex: number;
  effWidth: number;
  isHydrated: boolean;
  isDarkMode: boolean;
  effectiveLightboxEnabled: boolean;
  openLightboxOnCardClick: boolean;
  openLightbox: (index: number) => void;
  setIndex: (index: number) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  renderCard?: (index: number, isActive: boolean, item: CarouselItem) => ReactNode;
  renderCaption?: (props: {
    index: number;
    label: string;
    caption: string | null;
    active: boolean;
  }) => ReactNode;
  captionStyle?: CSSProperties;
  transition?: Transition;
  hiddenCardIndex?: number | null;
  disableCursor?: boolean;
  forceActive?: boolean;
  mobileAspect?: "16/9" | "4/3";
}

export function CarouselCard({
  item,
  index,
  currentIndex,
  effWidth,
  isHydrated,
  isDarkMode,
  effectiveLightboxEnabled,
  openLightboxOnCardClick,
  openLightbox,
  setIndex,
  cardRef,
  renderCard,
  renderCaption,
  captionStyle,
  transition,
  hiddenCardIndex,
  disableCursor = false,
  forceActive = false,
  mobileAspect = "16/9"
}: CarouselCardProps) {
  const { label, caption, imageUrl, videoUrl, alt, videoAutoplay, videoLoop, videoMuted, videoControls, cardVariant, backgroundLines, fetchPriority, withInsetShadow, mediaAspectRatio, content } = item;
  const isCompact = useIsCompact();
  const imageSizePercent = (isCompact ? item.mobileImageSizePercent : null) ?? item.imageSizePercent;
  const imagePosition = (isCompact ? item.mobileImagePosition : null) ?? item.imagePosition;
  const hasMedia = !!(imageUrl || videoUrl);
  // The media this card has put on screen — its image, a video's still or its first frame. Kept as
  // the URL rather than a flag, so a card handed new media reads as not shown again on its own,
  // with no effect needed to reset it.
  const mediaKey = videoUrl ?? imageUrl;
  const [shownMediaKey, setShownMediaKey] = useState<string | null>(null);
  const isMediaShown = shownMediaKey === mediaKey;
  const markMediaShown = () => setShownMediaKey(mediaKey);
  const [isHovered, setIsHovered] = useState(false);

  // Carousels only ever appear well below the fold, so no card's media belongs on the initial
  // load. Both the video source and the still are withheld until the card is within a viewport of
  // being scrolled to — see useNearViewport.
  const mediaGateRef = useRef<HTMLDivElement | null>(null);
  const isNearViewport = useNearViewport(mediaGateRef);
  // `src` is only ever attached once the card is near — an unset src downloads nothing, and
  // preload="none" keeps the browser from speculatively buffering a non-autoplaying video even
  // after it is attached.
  //
  // The elements keep their `autoPlay` attribute. That attribute used to be what forced a full
  // download on page load, but only because `src` was there from the start; gating the source is
  // what actually fixes that, and autoplay then does the right thing at the right moment. Keeping
  // it also keeps the browser's own playback lifecycle — a muted video that the browser paused
  // because its tab went to the background resumes by itself when the viewer returns, which a
  // one-shot play() call would not.
  const videoSrc = isNearViewport ? videoUrl ?? undefined : undefined;
  // The still behind a video is a `poster`, which has no lazy equivalent — the browser fetches it
  // as soon as the attribute is present. Withholding it is what keeps the four stills on
  // /alphagrill (2.6MB of PNG) off the initial load alongside their videos.
  const videoPoster = isNearViewport ? imageUrl ?? undefined : undefined;
  // Eager only for a still explicitly marked high priority; everything else defers so React does
  // not hoist it into a <head> preload that competes with the page's own JS and CSS.
  const imageLoading = fetchPriority === 'high' ? 'eager' : 'lazy';

  // A video's still is a poster, which fires no load event of its own, and the first frame can be
  // seconds behind it. Loading the same URL as an image (one request: it shares the poster's from
  // the cache) says when the still is ready, so it takes over from the skeleton without waiting.
  useEffect(() => {
    if (!videoPoster) return;
    let cancelled = false;
    const still = new Image();
    still.src = videoPoster;
    still.decode().then(
      () => { if (!cancelled) setShownMediaKey(mediaKey); },
      () => {}
    );
    return () => { cancelled = true; };
  }, [videoPoster, mediaKey]);

  // Until something is on screen the media stays invisible and a skeleton holds its place: an empty
  // <video> is otherwise a blank box, and one with no intrinsic size yet a 300px-wide one that the
  // inset shadow outlines. A video with neither autoplay nor a still never shows anything until it
  // is played, so it gets no skeleton to sit there forever.
  const showSkeleton = hasMedia && !renderCard && (videoUrl ? videoAutoplay || !!imageUrl : true);
  const mediaRevealStyle: CSSProperties = {
    opacity: isMediaShown ? 1 : 0,
    transition: `opacity ${MEDIA_REVEAL_MS}ms ease-out`,
  };

  const hasPositionedImage = imageSizePercent != null && imageUrl;
  const hasPositionedVideo = imageSizePercent != null && videoUrl;
  const hasVideo = !!videoUrl;
  const withBackgroundLines = cardVariant === "with-background-lines";
  const isActive = forceActive || index === currentIndex;
  // The hover scrim reads isHovered, not CSS :hover — see onPointerMove on the card.
  const backgroundClass =
    isActive && isHovered ? "bg-stone-200/60 dark:bg-zinc-800" : "bg-stone-200/20 dark:bg-zinc-800/70";
  const canOpenLightboxFromCard = effectiveLightboxEnabled && openLightboxOnCardClick && (imageUrl || videoUrl || content);

  const isHiddenByLightbox = hiddenCardIndex === index;

  // In the media's own box when its shape is known before anything has loaded (positioned media
  // with a mediaAspectRatio), across the whole card otherwise. It fades out as the media fades in
  // over it, its sheen paused, and stays at zero opacity rather than unmounting mid-fade.
  const skeleton = showSkeleton && (
    <div
      aria-hidden
      data-shown={isMediaShown ? "" : undefined}
      className="media-skeleton"
      style={{
        ...(imageSizePercent != null && mediaAspectRatio
          ? { height: `${imageSizePercent}%`, aspectRatio: mediaAspectRatio, ...calculateImagePosition(imagePosition) }
          : { inset: 0 }),
        opacity: isMediaShown ? 0 : 1,
        transition: `opacity ${MEDIA_REVEAL_MS}ms ease-out`,
      }}
    />
  );

  return (
    <div
      ref={mediaGateRef}
      className="flex flex-col items-center"
      style={{ width: effWidth > 0 ? effWidth : "100%" }}
    >
      {/* Only the card hides while the lightbox shows its copy; the caption below stays put. The
          hide sits on this transition-free wrapper so it flips in the same frame the copy unmounts:
          on the card itself, its transition-all would fade it back in, which flickers. */}
      <div className={`w-full${isHiddenByLightbox ? " opacity-0 pointer-events-none" : ""}`}>
        <motion.div
          ref={cardRef}
          initial={false}
          role="button"
          tabIndex={0}
          aria-label={`Select card ${index + 1}${label ? `: ${label}` : ""}`}
          onClick={(e) => {
            if (isActive) {
              if (openLightboxOnCardClick && effectiveLightboxEnabled) {
                // A click focuses the card, and the lightbox leaves that focus where it is. Its
                // Escape and arrow keys are keyboard use, which turns the still-focused card
                // :focus-visible, so the ring appeared on it as the lightbox closed. A pointer open
                // lets go of focus; a keyboard one (and assistive tech's click, detail 0) keeps it,
                // so the ring still marks the reader's place.
                if (e.detail > 0) e.currentTarget.blur();
                openLightbox(index);
              }
            } else {
              setIndex(index);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (isActive) {
                if (openLightboxOnCardClick && effectiveLightboxEnabled) openLightbox(index);
              } else {
                setIndex(index);
              }
            }
          }}
          // Hover follows the hand, not the page. CSS :hover also matches a card that slides in under
          // a resting pointer, so with the pointer parked over the column every card flashed its
          // scrim on and off as a scroll carried it past, and one lit up by itself when the lightbox
          // closed over it. Only real movement lights a card (an engine's synthetic move after a
          // scroll has no delta). The scrim and the light-mode shadow both read this one state —
          // the shadow used mouseenter, which React drops when the lightbox copy unmounts under the
          // pointer, so the two could disagree.
          onPointerMove={(e) => {
            if (e.pointerType === "touch" || (e.movementX === 0 && e.movementY === 0)) return;
            setIsHovered(true);
          }}
          onPointerLeave={() => setIsHovered(false)}
          className={`group relative ${mobileAspect === "4/3" ? "aspect-[4/3] sm:aspect-video" : "aspect-video"} ${backgroundClass} transition-all duration-150 ${
            disableCursor ? 'cursor-default'
              : isActive
              ? canOpenLightboxFromCard ? 'cursor-zoom-in' : 'cursor-default'
              : index < currentIndex ? 'cursor-[w-resize]' : 'cursor-[e-resize]'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/60 dark:focus-visible:ring-rose-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background ${!disableCursor && !isActive && isHovered ? 'opacity-70' : ''}`}
          style={{
            width: "100%",
            boxSizing: 'border-box',
            borderRadius: '4px',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ['cornerShape' as any]: 'squircle',
          }}
          transition={transition}
          whileTap={{ scale: 0.98 }}
        >
          {renderCard ? renderCard(index, isActive, item) : (
            <div
              className="w-full h-full relative overflow-hidden"
              style={{
                borderRadius: '4px',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['cornerShape' as any]: 'squircle',
              }}
            >
              {withBackgroundLines ? (
                <>
                  {/* Transparent so card background (and hover) show through */}
                  <div className="absolute inset-0 bg-transparent" aria-hidden />
                  {/* Theme-responsive line art behind video */}
                  {backgroundLines === "grill" && (
                    <div className="absolute inset-0 pointer-events-none z-0 text-stone-300 dark:text-zinc-700" aria-hidden>
                      <GrillLines className="w-full h-full" />
                    </div>
                  )}
                  {skeleton}
                  {/* Video on top */}
                  {hasVideo && (
                    hasPositionedVideo ? (
                      <video
                        src={videoSrc}
                        autoPlay={videoAutoplay}
                        poster={videoPoster}
                        className="absolute object-contain z-[1]"
                        loop={videoLoop}
                        muted={videoMuted}
                        controls={videoControls}
                        playsInline
                        preload="none"
                        onLoadedData={markMediaShown}
                        style={{
                          height: `${imageSizePercent}%`,
                          width: "auto",
                          ...calculateImagePosition(imagePosition),
                          ...mediaRevealStyle,
                        }}
                      />
                    ) : (
                      <video
                        src={videoSrc}
                        autoPlay={videoAutoplay}
                        poster={videoPoster}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                        loop={videoLoop}
                        muted={videoMuted}
                        controls={videoControls}
                        playsInline
                        preload="none"
                        onLoadedData={markMediaShown}
                        style={mediaRevealStyle}
                      />
                    )
                  )}
                </>
              ) : (
                <>
                  {skeleton}
                  {hasVideo ? (
                    hasPositionedVideo ? (
                    <video
                      src={videoSrc}
                      autoPlay={videoAutoplay}
                      poster={videoPoster}
                      className="absolute object-contain"
                      loop={videoLoop}
                      muted={videoMuted}
                      controls={videoControls}
                      playsInline
                      preload="none"
                      onLoadedData={markMediaShown}
                      style={{
                        height: `${imageSizePercent}%`,
                        width: 'auto',
                        ...calculateImagePosition(imagePosition),
                        ...mediaRevealStyle,
                        ...(withInsetShadow && isHydrated ? {
                          boxShadow: isDarkMode
                            ? 'inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.08), 0px 0px 0px 1px rgba(0,0,0,0.20), 0px 2px 4px rgba(0,0,0,0.25)'
                            : '0px 0px 0px 1px rgba(0,0,0,0.10), 0px 1px 1px -0.5px rgba(0,0,0,0.10), 0px 3px 3px -1.5px rgba(0,0,0,0.10)'
                        } : {})
                      }}
                    />
                  ) : (
                    <video
                      src={videoSrc}
                      autoPlay={videoAutoplay}
                      poster={videoPoster}
                      className="w-full h-full object-cover"
                      loop={videoLoop}
                      muted={videoMuted}
                      controls={videoControls}
                      playsInline
                      preload="none"
                      onLoadedData={markMediaShown}
                      style={mediaRevealStyle}
                    />
                  )
                ) : imageUrl ? (
                  hasPositionedImage ? (
                    <img
                      src={imageUrl}
                      alt={alt ?? label}
                      className="absolute object-contain"
                      fetchPriority={fetchPriority}
                      loading={imageLoading}
                      decoding="async"
                      ref={(el) => { if (el?.complete) markMediaShown(); }}
                      onLoad={markMediaShown}
                      style={{
                        height: `${imageSizePercent}%`,
                        width: 'auto',
                        ...calculateImagePosition(imagePosition),
                        ...mediaRevealStyle,
                      }}
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt={alt ?? label}
                      className="w-full h-full object-cover"
                      fetchPriority={fetchPriority}
                      loading={imageLoading}
                      decoding="async"
                      ref={(el) => { if (el?.complete) markMediaShown(); }}
                      onLoad={markMediaShown}
                      style={mediaRevealStyle}
                    />
                  )
                ) : content ? (
                  content
                ) : (
                  <div className="w-full h-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center">
                    <span className="text-stone-500 text-sm">{label}</span>
                  </div>
                )}
                </>
              )}
            </div>
          )}
          {/* Border layer on top */}
          {(imageUrl || videoUrl || content) && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: isHydrated
                  ? isDarkMode
                    ? 'inset 0 1px 0 0 rgba(255,255,255,0.02), inset 0 0 0 1px rgba(255,255,255,0.02), 0 1px 1px -0.5px rgba(0,0,0,0.18)'
                    : isHovered ? CARD_LIGHT_SHADOW.hover : CARD_LIGHT_SHADOW.default
                  : 'none',
                transition: `box-shadow ${isHovered ? '150ms' : '0ms'} ease-out`,
                boxSizing: 'border-box',
                borderRadius: '4px',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['cornerShape' as any]: 'squircle',
                zIndex: 10
              }}
            />
          )}

        </motion.div>
      </div>

      {caption != null && caption !== "" ? (
        renderCaption ? (
          renderCaption({ index, label, caption, active: isActive })
        ) : (
          <div
            className="carousel-caption text-center text-balance text-[13px] leading-[145%] sm:text-sm sm:leading-[1.6] mt-2 sm:mt-3 md:mt-4 font-sans"
            style={{ width: "100%", ...(captionStyle || {}) }}
          >
            {renderCaptionWithBadges(caption, { muted: true })}
          </div>
        )
      ) : null}
    </div>
  );
}
