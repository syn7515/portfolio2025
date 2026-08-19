/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { motion, type Transition } from "framer-motion";
import { calculateImagePosition, useNearViewport, type CarouselItem } from "./hooks";
import { GrillLines } from "./grill-lines";
import { CARD_LIGHT_SHADOW } from "@/components/ui/card-shadow";
import { renderCaptionWithBadges } from "@/components/ui/sup-caption-badge";

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
  forceActive = false
}: CarouselCardProps) {
  const { label, caption, imageUrl, videoUrl, alt, imageSizePercent, imagePosition, videoAutoplay, videoLoop, videoMuted, videoControls, cardVariant, backgroundLines, fetchPriority, withInsetShadow } = item;
  const hasMedia = !!(imageUrl || videoUrl);
  const [isMediaLoading, setIsMediaLoading] = useState(hasMedia);
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

  useEffect(() => {
    if (imageUrl || videoUrl) {
      setIsMediaLoading(true);
    }
  }, [imageUrl, videoUrl]);

  // The spinner means "media is on its way". A card that hasn't been scrolled near yet hasn't
  // started loading anything, and a non-autoplaying video won't load until the viewer presses
  // play — neither should sit there spinning.
  const showSpinner =
    isMediaLoading && hasMedia && !renderCard && (videoUrl ? isNearViewport && videoAutoplay : true);

  const hasPositionedImage = imageSizePercent != null && imageUrl;
  const hasPositionedVideo = imageSizePercent != null && videoUrl;
  const hasVideo = !!videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const withBackgroundLines = cardVariant === "with-background-lines";
  const isActive = forceActive || index === currentIndex;
  const backgroundClass =
    hasPositionedMedia || withBackgroundLines
      ? `bg-stone-200/20 dark:bg-zinc-800/70 ${isActive ? "hover:bg-stone-200/60 dark:hover:bg-zinc-800" : ""}`
      : `bg-stone-200/20 dark:bg-zinc-800/70 ${isActive ? "hover:bg-stone-200/60 dark:hover:bg-zinc-800" : ""}`;
  const canOpenLightboxFromCard = effectiveLightboxEnabled && openLightboxOnCardClick && (imageUrl || videoUrl);

  const isHiddenByLightbox = hiddenCardIndex === index;

  return (
    <div
      ref={mediaGateRef}
      className={`flex flex-col items-center${isHiddenByLightbox ? " opacity-0 pointer-events-none" : ""}`}
      style={{ width: effWidth > 0 ? effWidth : "100%" }}
    >
      <motion.div
        ref={cardRef}
        initial={false}
        role="button"
        tabIndex={0}
        aria-label={`Select card ${index + 1}${label ? `: ${label}` : ""}`}
        onClick={() => {
          if (isActive) {
            if (openLightboxOnCardClick && effectiveLightboxEnabled) openLightbox(index);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative ${backgroundClass} transition-all duration-150 ${
          disableCursor ? 'cursor-default'
            : isActive
            ? canOpenLightboxFromCard ? 'cursor-zoom-in' : 'cursor-default'
            : index < currentIndex ? 'cursor-[w-resize]' : 'cursor-[e-resize]'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600/60 dark:focus-visible:ring-orange-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background ${!disableCursor && !isActive ? 'hover:opacity-70' : ''}`}
        style={{
          width: "100%",
          aspectRatio: '16/9',
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
                      onCanPlay={() => setIsMediaLoading(false)}
                      style={{
                        height: `${imageSizePercent}%`,
                        width: "auto",
                        ...calculateImagePosition(imagePosition),
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
                      onCanPlay={() => setIsMediaLoading(false)}
                    />
                  )
                )}
              </>
            ) : (
              <>
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
                    onCanPlay={() => setIsMediaLoading(false)}
                    style={{
                      height: `${imageSizePercent}%`,
                      width: 'auto',
                      ...calculateImagePosition(imagePosition),
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
                    onCanPlay={() => setIsMediaLoading(false)}
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
                    ref={(el) => { if (el?.complete) setIsMediaLoading(false); }}
                    onLoad={() => setIsMediaLoading(false)}
                    style={{
                      height: `${imageSizePercent}%`,
                      width: 'auto',
                      ...calculateImagePosition(imagePosition)
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
                    ref={(el) => { if (el?.complete) setIsMediaLoading(false); }}
                    onLoad={() => setIsMediaLoading(false)}
                  />
                )
              ) : (
                <div className="w-full h-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center">
                  <span className="text-stone-500 text-sm">{label}</span>
                </div>
              )}
              </>
            )}
          </div>
        )}
        {/* Loading spinner */}
        {showSpinner && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-zinc-600 border-t-stone-500 dark:border-t-zinc-400 animate-spin" />
          </div>
        )}

        {/* Border layer on top */}
        {(imageUrl || videoUrl) && (
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

      {caption != null && caption !== "" ? (
        renderCaption ? (
          renderCaption({ index, label, caption, active: isActive })
        ) : (
          <div
            className="carousel-caption text-center text-balance text-sm mt-2 sm:mt-3 md:mt-4 font-sans"
            style={{ width: "100%", ...(captionStyle || {}) }}
          >
            {renderCaptionWithBadges(caption, { muted: true })}
          </div>
        )
      ) : null}
    </div>
  );
}
