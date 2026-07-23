/* eslint-disable @next/next/no-img-element */
"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useLightboxDimensions,
  calculateImagePosition,
  type CarouselItem,
} from "./hooks";
import { GrillLines } from "./grill-lines";
import { CARD_LIGHT_SHADOW } from "@/components/ui/card-shadow";
import { renderCaptionWithBadges } from "@/components/ui/sup-caption-badge";

const NAV_BUTTON_MOTION_CLASS =
  "rounded-full p-2 sm:p-3 pointer-events-auto transition-[scale,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:enabled:active:scale-[0.97] motion-reduce:transition-[background-color]";

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
}

interface LightboxContentProps {
  currentItem: CarouselItem;
  initialTransform: TransformSnapshot | null;
  exitTransform: TransformSnapshot | null;
  exitDuration: number;
  isDarkMode: boolean;
  dimensions: { width: number; height: number };
}

function LightboxContent({
  currentItem,
  initialTransform,
  exitTransform,
  exitDuration,
  isDarkMode,
  dimensions,
}: LightboxContentProps) {
  const hasPositionedImage = currentItem?.imageSizePercent != null && currentItem?.imageUrl;
  const hasPositionedVideo = currentItem?.imageSizePercent != null && currentItem?.videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const hasVideo = !!currentItem?.videoUrl;
  const withBackgroundLines = currentItem?.cardVariant === "with-background-lines";
  
  if (hasPositionedMedia) {
    // Positioned image or video mode with background layers
    return (
      <motion.div
        className="relative pointer-events-auto rounded-[4px]"
        initial={initialTransform ? {
          x: initialTransform.x,
          y: initialTransform.y,
          width: initialTransform.width,
          height: initialTransform.height,
        } : false}
        animate={{
          x: 0,
          y: 0,
          width: initialTransform ? initialTransform.finalWidth : dimensions.width,
          height: initialTransform ? initialTransform.finalHeight : dimensions.height,
        }}
        exit={exitTransform ? {
          x: exitTransform.x,
          y: exitTransform.y,
          width: exitTransform.width,
          height: exitTransform.height,
        } : {}}
        transition={{
          duration: exitTransform ? exitDuration : 0.4,
          ease: [0.77, 0, 0.175, 1]
        }}
        style={{
          aspectRatio: '16/9',
          boxSizing: 'border-box',
          width: !initialTransform && !exitTransform ? dimensions.width : undefined,
          height: !initialTransform && !exitTransform ? dimensions.height : undefined,
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
                <video
                  src={currentItem.videoUrl ?? undefined}
                  className="absolute object-contain z-[1]"
                  autoPlay={currentItem.videoAutoplay ?? true}
                  loop={currentItem.videoLoop ?? true}
                  muted={currentItem.videoMuted ?? true}
                  controls={currentItem.videoControls ?? false}
                  playsInline
                  aria-label={currentItem.alt || currentItem.label || "Lightbox video"}
                  style={{
                    opacity: 1,
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
                <video
                  src={currentItem.videoUrl ?? undefined}
                  className="absolute object-contain"
                  autoPlay={currentItem.videoAutoplay ?? true}
                  loop={currentItem.videoLoop ?? true}
                  muted={currentItem.videoMuted ?? true}
                  controls={currentItem.videoControls ?? false}
                  playsInline
                  aria-label={currentItem.alt || currentItem.label || "Lightbox video"}
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
        initial={initialTransform ? {
          x: initialTransform.x,
          y: initialTransform.y,
          width: initialTransform.width,
          height: initialTransform.height,
        } : false}
        animate={{
          x: 0,
          y: 0,
          width: initialTransform ? initialTransform.finalWidth : dimensions.width,
          height: initialTransform ? initialTransform.finalHeight : dimensions.height,
        }}
        exit={exitTransform ? {
          x: exitTransform.x,
          y: exitTransform.y,
          width: exitTransform.width,
          height: exitTransform.height,
        } : {}}
        transition={{
          duration: exitTransform ? exitDuration : 0.4,
          ease: [0.77, 0, 0.175, 1]
        }}
        style={{
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          width: !initialTransform && !exitTransform ? dimensions.width : undefined,
          height: !initialTransform && !exitTransform ? dimensions.height : undefined,
        }}
      >
        {/* overflow-hidden scoped to inner div so border overlay shadow is not clipped */}
        <div className="absolute inset-0 overflow-hidden rounded-[4px]">
          {hasVideo ? (
            <video
              src={currentItem.videoUrl ?? undefined}
              className="object-contain w-full h-full"
              autoPlay={currentItem.videoAutoplay ?? true}
              loop={currentItem.videoLoop ?? true}
              muted={currentItem.videoMuted ?? true}
              controls={currentItem.videoControls ?? false}
              playsInline
              style={{ opacity: 1, display: 'block', transformOrigin: 'center center' }}
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
}: LightboxProps) {
  const dimensions = useLightboxDimensions();
  const isPrevDisabled = lightboxIndex === 0;
  const isNextDisabled = lightboxIndex >= normalizedItems.length - 1;
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  const [isPrevHovered, setIsPrevHovered] = useState(false);
  const [isNextHovered, setIsNextHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const vpCenterX = window.innerWidth / 2;
    const vpCenterY = window.innerHeight / 2;
    const dx = Math.abs(e.clientX - vpCenterX);
    const dy = Math.abs(e.clientY - vpCenterY);

    if (dx <= dimensions.width / 2 && dy <= dimensions.height / 2) {
      if (e.clientX < vpCenterX && !isPrevDisabled) {
        setCursorStyle('w-resize');
      } else if (e.clientX >= vpCenterX && !isNextDisabled) {
        setCursorStyle('e-resize');
      } else {
        setCursorStyle('default');
      }
    } else {
      setCursorStyle('zoom-out');
    }
  };

  const handleMouseLeave = () => setCursorStyle('zoom-out');

  const handleClick = (e: React.MouseEvent) => {
    const vpCenterX = window.innerWidth / 2;
    const vpCenterY = window.innerHeight / 2;
    const dx = Math.abs(e.clientX - vpCenterX);
    const dy = Math.abs(e.clientY - vpCenterY);

    if (dx <= dimensions.width / 2 && dy <= dimensions.height / 2) {
      if (e.clientX < vpCenterX) {
        if (!isPrevDisabled) prevLightbox();
      } else {
        if (!isNextDisabled) nextLightbox();
      }
    } else {
      closeLightbox();
    }
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
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.77, 0, 0.175, 1] }}
            className={`fixed inset-0 z-[70] backdrop-blur-[1.5px] cursor-zoom-out ${isDarkMode ? 'bg-black/70' : 'bg-stone-100/85'}`}
            onClick={closeLightbox}
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
              className="absolute inset-0 pointer-events-auto flex items-center justify-center"
              style={{ overflow: 'visible', cursor: cursorStyle }}
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
                />
              </div>

              {/* Caption - fixed relative to viewport so it doesn't move during the open/close animation */}
              {(() => {
                const caption = normalizedItems[lightboxIndex]?.caption?.trim();
                if (!caption) return null;
                return (
                  <motion.div
                    className={`fixed left-0 right-0 text-center font-sans text-xs sm:text-sm pointer-events-none ${isDarkMode ? '!text-white' : '!text-stone-600'}`}
                    style={{ top: `calc(50% + ${dimensions.height / 2}px + 1rem)` }}
                    initial={{ opacity: 0, filter: 'blur(2px)' }}
                    animate={
                      exitTransform
                        ? { opacity: 0, filter: 'blur(2px)' }
                        : { opacity: 1, filter: 'blur(0px)' }
                    }
                    transition={{
                      duration: exitTransform ? exitDuration : 0.4,
                      ease: [0.77, 0, 0.175, 1],
                    }}
                  >
                    {renderCaptionWithBadges(caption)}
                  </motion.div>
                );
              })()}

              {/* Prev/Next buttons - only when more than one item */}
              {!exitTransform && normalizedItems.length > 1 && (
                <>
                  <div
                    className="absolute z-20 pointer-events-none"
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
                        boxShadow: isDarkMode
                          ? 'inset 0 1px 0 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.03), 0px 2px 8px rgba(0,0,0,0.35)'
                          : '0px 0px 1px 0px rgba(0,0,0,0.3), 0px 2px 8px 0px rgba(0,0,0,0.08)',
                      }}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" style={{ transform: 'translateX(-1.5px)' }} />
                    </button>
                  </div>
                  <div
                    className="absolute z-20 pointer-events-none"
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
                        boxShadow: isDarkMode
                          ? 'inset 0 1px 0 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.03), 0px 2px 8px rgba(0,0,0,0.35)'
                          : '0px 0px 1px 0px rgba(0,0,0,0.3), 0px 2px 8px 0px rgba(0,0,0,0.08)',
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
