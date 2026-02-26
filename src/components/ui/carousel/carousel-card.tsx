/* eslint-disable @next/next/no-img-element */
"use client"

import type { CSSProperties, ReactNode } from "react";
import { motion, type Transition } from "framer-motion";
import { calculateImagePosition, type CarouselItem } from "./hooks";

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
  const { label, caption, imageUrl, videoUrl, alt, imageSizePercent, imagePosition, videoAutoplay, videoLoop, videoMuted, videoControls } = item;
  const hasPositionedImage = imageSizePercent != null && imageUrl;
  const hasPositionedVideo = imageSizePercent != null && videoUrl;
  const hasVideo = !!videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const backgroundClass = hasPositionedMedia 
    ? `bg-stone-200/60 dark:bg-zinc-700/80 ${index === currentIndex ? 'hover:bg-stone-300 dark:hover:bg-zinc-600' : ''}` 
    : `bg-stone-200/60 dark:bg-stone-800 ${index === currentIndex ? 'hover:bg-stone-300 dark:hover:bg-stone-700' : ''}`;
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
            {hasVideo ? (
              hasPositionedVideo ? (
                // Positioned video mode with background
                <video 
                  src={videoUrl} 
                  className="absolute object-contain"
                  autoPlay={videoAutoplay}
                  loop={videoLoop}
                  muted={videoMuted}
                  controls={videoControls}
                  playsInline
                  style={{
                    height: `${imageSizePercent}%`,
                    width: 'auto',
                    ...calculateImagePosition(imagePosition)
                  }}
                />
              ) : (
                // Full-cover video mode
                <video 
                  src={videoUrl} 
                  className="w-full h-full object-cover"
                  autoPlay={videoAutoplay}
                  loop={videoLoop}
                  muted={videoMuted}
                  controls={videoControls}
                  playsInline
                />
              )
            ) : imageUrl ? (
              hasPositionedImage ? (
                // Positioned image mode with background
                <img 
                  src={imageUrl} 
                  alt={alt ?? label}
                  className="absolute object-contain"
                  style={{
                    height: `${imageSizePercent}%`,
                    width: 'auto',
                    ...calculateImagePosition(imagePosition)
                  }}
                />
              ) : (
                // Full-cover image mode
                <img 
                  src={imageUrl} 
                  alt={alt ?? label}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center">
                <span className="text-stone-500 text-sm">{label}</span>
              </div>
            )}
          </div>
        )}
        {/* Border layer on top */}
        {(imageUrl || videoUrl) && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: isHydrated ? (isDarkMode ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.02)') : '1px solid rgba(0, 0, 0, 0.02)',
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
            className={`text-center text-stone-600 dark:text-stone-300 text-xs sm:text-sm mt-2 sm:mt-3 md:mt-5 font-sans`}
            style={{ width: "100%", ...(captionStyle || {}) }}
          >
            {caption}
          </div>
        )
      ) : null}
    </div>
  );
}

