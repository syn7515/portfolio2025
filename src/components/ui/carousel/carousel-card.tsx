/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react";
import { useState, useEffect } from "react";
import { motion, type Transition } from "framer-motion";
import { calculateImagePosition, type CarouselItem } from "./hooks";
import { GrillLines } from "./grill-lines";

function CaptionSupBadge({ supId }: { supId: string }) {
  return (
    <span
      id={`sup-caption-${supId}`}
      onClick={(e) => {
        e.stopPropagation()
        document.getElementById(`sup-body-${supId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }}
      className="inline-flex items-center justify-center rounded-full w-[13px] h-[13px] text-[10px] leading-none font-medium text-white cursor-pointer select-none relative -top-[5px] ml-[2px] transition-colors duration-150 bg-stone-300 hover:bg-orange-700 dark:bg-zinc-600 dark:hover:bg-lime-200 dark:hover:text-zinc-900"
    >
      {supId}
    </span>
  )
}

function renderCaptionWithBadges(caption: string): ReactNode {
  const parts = caption.split(/(<sup>\d+<\/sup>)/g)
  if (parts.length === 1) return <span dangerouslySetInnerHTML={{ __html: caption }} />
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^<sup>(\d+)<\/sup>$/)
        if (match) return <CaptionSupBadge key={i} supId={match[1]} />
        return part ? <span key={i} dangerouslySetInnerHTML={{ __html: part }} /> : null
      })}
    </>
  )
}

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
  disableCursor = false
}: CarouselCardProps) {
  const { label, caption, imageUrl, videoUrl, alt, imageSizePercent, imagePosition, videoAutoplay, videoLoop, videoMuted, videoControls, cardVariant, backgroundLines, fetchPriority, withInsetShadow } = item;
  const videoPreload = fetchPriority === 'high' ? 'auto' : 'metadata';
  const hasMedia = !!(imageUrl || videoUrl);
  const [isMediaLoading, setIsMediaLoading] = useState(hasMedia);

  useEffect(() => {
    if (imageUrl || videoUrl) {
      setIsMediaLoading(true);
    }
  }, [imageUrl, videoUrl]);

  const hasPositionedImage = imageSizePercent != null && imageUrl;
  const hasPositionedVideo = imageSizePercent != null && videoUrl;
  const hasVideo = !!videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const withBackgroundLines = cardVariant === "with-background-lines";
  const backgroundClass =
    hasPositionedMedia || withBackgroundLines
      ? `bg-stone-200/50 dark:bg-zinc-800/70 ${index === currentIndex ? "hover:bg-stone-200 dark:hover:bg-zinc-800" : ""}`
      : `bg-stone-200/50 dark:bg-zinc-800/70 ${index === currentIndex ? "hover:bg-stone-200 dark:hover:bg-zinc-800" : ""}`;
  const canOpenLightboxFromCard = effectiveLightboxEnabled && openLightboxOnCardClick && (imageUrl || videoUrl);
  
  const isHiddenByLightbox = hiddenCardIndex === index;

  return (
    <div
      className={`flex flex-col items-center${isHiddenByLightbox ? " opacity-0 pointer-events-none" : ""}`}
      style={{ width: effWidth }}
    >
      <motion.div
        ref={cardRef}
        initial={false}
        role="button"
        tabIndex={0}
        aria-label={`Select card ${index + 1}${label ? `: ${label}` : ""}`}
        onClick={() => {
          if (index === currentIndex) {
            if (openLightboxOnCardClick && effectiveLightboxEnabled) openLightbox(index);
          } else {
            setIndex(index);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (index === currentIndex) {
              if (openLightboxOnCardClick && effectiveLightboxEnabled) openLightbox(index);
            } else {
              setIndex(index);
            }
          }
        }}
        className={`group relative ${backgroundClass} transition-all duration-150 ${
          disableCursor ? 'cursor-default'
            : index === currentIndex
            ? canOpenLightboxFromCard ? 'cursor-zoom-in' : 'cursor-default'
            : index < currentIndex ? 'cursor-[w-resize]' : 'cursor-[e-resize]'
        } focus-visible:ring-2 focus-visible:ring-stone-400 overflow-hidden ${!disableCursor && index !== currentIndex ? 'hover:opacity-70' : ''}`}
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
        {renderCard ? renderCard(index, index === currentIndex, item) : (
          <div className="w-full h-full relative overflow-hidden">
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
                      src={videoUrl}
                      className="absolute object-contain z-[1]"
                      autoPlay={videoAutoplay}
                      loop={videoLoop}
                      muted={videoMuted}
                      controls={videoControls}
                      playsInline
                      preload={videoPreload}
                      onCanPlay={() => setIsMediaLoading(false)}
                      style={{
                        height: `${imageSizePercent}%`,
                        width: "auto",
                        ...calculateImagePosition(imagePosition),
                      }}
                    />
                  ) : (
                    <video
                      src={videoUrl}
                      className="absolute inset-0 w-full h-full object-cover z-[1]"
                      autoPlay={videoAutoplay}
                      loop={videoLoop}
                      muted={videoMuted}
                      controls={videoControls}
                      playsInline
                      preload={videoPreload}
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
                    src={videoUrl}
                    className="absolute object-contain"
                    autoPlay={videoAutoplay}
                    loop={videoLoop}
                    muted={videoMuted}
                    controls={videoControls}
                    playsInline
                    preload={videoPreload}
                    onCanPlay={() => setIsMediaLoading(false)}
                    style={{
                      height: `${imageSizePercent}%`,
                      width: 'auto',
                      ...calculateImagePosition(imagePosition)
                    }}
                  />
                ) : (
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay={videoAutoplay}
                    loop={videoLoop}
                    muted={videoMuted}
                    controls={videoControls}
                    playsInline
                    preload={videoPreload}
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
        {isMediaLoading && hasMedia && !renderCard && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-zinc-600 border-t-stone-500 dark:border-t-zinc-400 animate-spin" />
          </div>
        )}

        {/* Border layer on top */}
        {(imageUrl || videoUrl) && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: isHydrated && !isDarkMode ? '1px solid rgba(0, 0, 0, 0.02)' : 'none', // dark mode border is handled via inset box-shadow
              boxShadow: isHydrated
                ? isDarkMode
                  ? withInsetShadow
                    ? 'inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.08), 0 1px 1px -0.5px rgba(0,0,0,0.18)'
                    : 'inset 0 1px 0 0 rgba(255,255,255,0.02), inset 0 0 0 1px rgba(255,255,255,0.02), 0 1px 1px -0.5px rgba(0,0,0,0.18)'
                  : '0px 0px 0px 1px rgba(0,0,0,0.10), 0px 1px 1px -0.5px rgba(0,0,0,0.10), 0px 3px 3px -1.5px rgba(0,0,0,0.10)'
                : 'none',
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
          renderCaption({ index, label, caption, active: index === currentIndex })
        ) : (
          <div
            className={`carousel-caption text-center text-xs sm:text-sm mt-2 sm:mt-3 md:mt-4 font-sans`}
            style={{ width: "100%", ...(captionStyle || {}) }}
          >
            {renderCaptionWithBadges(caption)}
          </div>
        )
      ) : null}
    </div>
  );
}

