/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react";
import { useState, useEffect } from "react";
import { motion, type Transition } from "framer-motion";
import { calculateImagePosition, type CarouselItem } from "./hooks";
import { GrillLines } from "./grill-lines";

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
  transition
}: CarouselCardProps) {
  const { label, caption, imageUrl, videoUrl, alt, imageSizePercent, imagePosition, videoAutoplay, videoLoop, videoMuted, videoControls, cardVariant, backgroundLines, fetchPriority } = item;
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
  
  return (
    <div className="flex flex-col items-center" style={{ width: effWidth }}>
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
        className={`group relative ${backgroundClass} transition-all duration-150 ${canOpenLightboxFromCard && index === currentIndex ? 'cursor-zoom-in' : 'cursor-pointer'} focus-visible:ring-2 focus-visible:ring-stone-400 overflow-hidden ${index !== currentIndex ? 'hover:opacity-70' : ''}`}
        style={{ 
          width: "100%", 
          aspectRatio: '16/9',
          boxSizing: 'border-box'
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
              border: isHydrated && !isDarkMode ? '1px solid rgba(0, 0, 0, 0.02)' : 'none',
              boxSizing: 'border-box',
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
            className={`text-center text-stone-500 dark:text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3 md:mt-4 font-sans`}
            style={{ width: "100%", ...(captionStyle || {}) }}
          >
            {caption}
          </div>
        )
      ) : null}
    </div>
  );
}

