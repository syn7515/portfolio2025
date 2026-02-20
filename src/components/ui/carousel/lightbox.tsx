/* eslint-disable @next/next/no-img-element */
"use client"

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useLightboxDimensions,
  calculateImagePosition,
  type CarouselItem,
} from "./hooks";

export type TransformSnapshot = {
  x: number;
  y: number;
  width: number;
  height: number;
  finalWidth: number;
  finalHeight: number;
};

interface LightboxProps {
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
}

interface LightboxContentProps {
  currentItem: CarouselItem;
  initialTransform: TransformSnapshot | null;
  exitTransform: TransformSnapshot | null;
  exitDuration: number;
  isDarkMode: boolean;
}

function LightboxContent({
  currentItem,
  initialTransform,
  exitTransform,
  exitDuration,
  isDarkMode,
}: LightboxContentProps) {
  const dimensions = useLightboxDimensions();
  const hasPositionedImage = currentItem?.imageSizePercent != null && currentItem?.imageUrl;
  const hasPositionedVideo = currentItem?.imageSizePercent != null && currentItem?.videoUrl;
  const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
  const hasVideo = !!currentItem?.videoUrl;
  
  if (hasPositionedMedia) {
    // Positioned image or video mode with background layers
    return (
      <motion.div 
        className="relative pointer-events-auto overflow-hidden"
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
          // Use inline styles for responsive updates if not animating
          width: !initialTransform && !exitTransform ? dimensions.width : undefined,
          height: !initialTransform && !exitTransform ? dimensions.height : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Base layer: page background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff'
          }}
        />
        {/* Top layer: project-item background */}
        <div 
          className="absolute inset-0 bg-stone-200/60 dark:bg-zinc-700/80"
        />
        {/* Image or Video */}
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
              ...calculateImagePosition(currentItem.imagePosition)
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
              ...calculateImagePosition(currentItem.imagePosition)
            }}
          />
        )}
      </motion.div>
    );
  } else {
    // Full-cover image or video mode
    return (
      <motion.div 
        className="relative pointer-events-auto overflow-hidden"
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
          // Use inline styles for responsive updates if not animating
          width: !initialTransform && !exitTransform ? dimensions.width : undefined,
          height: !initialTransform && !exitTransform ? dimensions.height : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasVideo ? (
          <video
            src={currentItem.videoUrl ?? undefined}
            className="object-contain w-full h-full"
            autoPlay={currentItem.videoAutoplay ?? true}
            loop={currentItem.videoLoop ?? true}
            muted={currentItem.videoMuted ?? true}
            controls={currentItem.videoControls ?? false}
            playsInline
            style={{ 
              opacity: 1, 
              display: 'block',
              transformOrigin: 'center center'
            }}
          />
        ) : (
          <img
            src={currentItem?.imageUrl ?? "/placeholder.svg"}
            alt={currentItem?.alt || currentItem?.label || "Lightbox image"}
            className="object-contain w-full h-full"
            style={{ 
              opacity: 1, 
              display: 'block',
              transformOrigin: 'center center'
            }}
          />
        )}
      </motion.div>
    );
  }
}

export function Lightbox({
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
  isLgOrAbove
}: LightboxProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay with opacity */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-50 bg-black" 
            onClick={closeLightbox}
          />
          
          {/* Lightbox content container */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog" 
            aria-modal="true"
          >
            {/* Close button - top-right corner of viewport */}
            {!exitTransform && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                className="absolute top-4 right-4 rounded-md p-2 text-white hover:bg-white/10 transition-colors z-20 pointer-events-auto"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {/* Image container - positioned absolutely to allow animation without clipping */}
            <div 
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ overflow: 'visible' }}
            >
              {/* Content + caption stacked so caption sits right below image/video */}
              <div
                className="flex flex-col items-center gap-4"
                style={
                  normalizedItems[lightboxIndex]?.caption?.trim()
                    ? { transform: "translateY(24px)" }
                    : undefined
                }
              >
                <LightboxContent 
                  currentItem={normalizedItems[lightboxIndex]}
                  initialTransform={initialTransform}
                  exitTransform={exitTransform}
                  exitDuration={exitDuration}
                  isDarkMode={isDarkMode}
                />
                {/* Caption - right below lightbox image/video, same enter/exit timing */}
                {(() => {
                  const caption = normalizedItems[lightboxIndex]?.caption?.trim();
                  const hasHtml = caption?.includes("<");
                  if (!caption) return null;
                  return (
                    <motion.div
                      className="text-center font-sans text-xs !text-white sm:text-sm"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={
                        exitTransform
                          ? { opacity: 0, scale: 0.95 }
                          : { opacity: 1, scale: 1 }
                      }
                      transition={{
                        duration: exitTransform ? exitDuration : 0.4,
                        ease: [0.77, 0, 0.175, 1],
                      }}
                      {...(hasHtml
                        ? { dangerouslySetInnerHTML: { __html: caption } }
                        : { children: caption })}
                    />
                  );
                })()}
              </div>

              {/* Prev button - outside image, close to it on the left */}
              {!exitTransform && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevLightbox();
                  }}
                  disabled={lightboxIndex === 0}
                  className="absolute rounded-md p-1.5 sm:p-2 text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors z-20 pointer-events-auto"
                  style={{
              left: `calc(50% - min(640px, calc(50vw - 16px - 40px - ${isLgOrAbove ? "16px" : "4px"})) - ${isLgOrAbove ? "16px" : "4px"})`,
                    top: '50%',
                    transform: 'translate(-100%, -50%)',
                  }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Next button - outside image, close to it on the right */}
              {!exitTransform && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextLightbox();
                  }}
                  disabled={lightboxIndex >= normalizedItems.length - 1}
                  className="absolute rounded-md p-1.5 sm:p-2 text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors z-20 pointer-events-auto"
                  style={{
              left: `calc(50% + min(640px, calc(50vw - 16px - 40px - ${isLgOrAbove ? "16px" : "4px"})) + ${isLgOrAbove ? "16px" : "4px"})`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

