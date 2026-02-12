"use client"

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarouselCard } from "./carousel/carousel-card";
import { CarouselIndicators } from "./carousel/carousel-indicators";
import { Lightbox } from "./carousel/lightbox";
import { normalizeItem, useResponsiveSizing, FALLBACK_ITEMS } from "./carousel/hooks";

// LabelIndicatorCarousel Component (Responsive)
// - Responsive sizing defaults by viewport unless overridden by props
// - Responsive text sizing for captions: text-xs sm:text-sm

const defaultTransition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

export default function LabelIndicatorCarousel({
  items,
  currentIndex,
  defaultIndex = 0,
  onChange,
  cardWidth,
  cardHeight,
  gap,
  renderCard,
  renderCaption,
  captionStyle,
  transition = defaultTransition,
  indicatorExpandedWidth,
  indicatorCollapsedSize,
  indicatorHeight,
  ariaLabel = "Label indicator carousel",
  className = "h-auto w-full max-w-full overflow-hidden",
  enableDrag = true,
  swipeThreshold = 0.25,
  velocityThreshold = 500,
  wheelToNavigate = true,
  // Lightbox options
  enableLightbox = true,
  openLightboxOnCardClick = true,
  // Indicator options
  showIndicators = true,
} = {}) {
  const sourceItems = items ?? FALLBACK_ITEMS;
  const normalized = useMemo(() => sourceItems.map(normalizeItem), [sourceItems]);
  const isControlled = typeof currentIndex === "number";
  const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultIndex);
  const index = isControlled ? currentIndex : uncontrolledIndex;

  // Viewport detection for mobile mode (< 640px) - vertical layout
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Viewport detection for disabling lightbox on sm and below
  const [isSmOrBelow, setIsSmOrBelow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // md breakpoint
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSmOrBelow(window.innerWidth < 768);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Viewport detection for lg+ (1024px+)
  const [isLgOrAbove, setIsLgOrAbove] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024; // lg breakpoint
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLgOrAbove(window.innerWidth >= 1024);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Dark mode detection - only set after hydration to avoid SSR mismatch
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Lightbox state
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(index);
  const [initialTransform, setInitialTransform] = useState(null);
  const [exitTransform, setExitTransform] = useState(null);
  const [exitDuration, setExitDuration] = useState(0.4);
  const [pendingLightboxIndex, setPendingLightboxIndex] = useState(null); // For delayed transform calculation
  const cardRefs = useRef({});
  const scrollbarGutterRef = useRef(0); // Store scrollbar gutter for exit animation
  
  // Disable lightbox on mobile (< 640px) and sm and below
  const effectiveLightboxEnabled = enableLightbox && !isMobile && !isSmOrBelow;

  const calculateCardTransform = useCallback((cardIndex) => {
    const cardElement = cardRefs.current[cardIndex];
    if (!cardElement) return null;

    // Get the actual image or video element inside the card for size calculations
    const imageElement = cardElement.querySelector('img');
    const videoElement = cardElement.querySelector('video');
    const mediaElement = imageElement || videoElement;
    if (!mediaElement) return null;

    // Get bounding rect of the container (card element) for animation
    const containerRect = cardElement.getBoundingClientRect();
    const mediaRect = mediaElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate final position (center of viewport)
    const finalX = viewportWidth / 2;
    const finalY = viewportHeight / 2;
    
    // Calculate initial position (center of container bounding box)
    // Note: scrollbar compensation is now handled in the effect that calls this function
    const initialX = containerRect.left + containerRect.width / 2;
    const initialY = containerRect.top + containerRect.height / 2;
    
    // Get natural media dimensions for size calculations
    let mediaNaturalWidth = mediaRect.width;
    let mediaNaturalHeight = mediaRect.height;
    
    if (imageElement && imageElement.complete) {
      mediaNaturalWidth = imageElement.naturalWidth;
      mediaNaturalHeight = imageElement.naturalHeight;
    } else if (videoElement && videoElement.readyState >= 2) {
      mediaNaturalWidth = videoElement.videoWidth;
      mediaNaturalHeight = videoElement.videoHeight;
    }
    
    // Calculate the media's natural aspect ratio
    const mediaAspectRatio = mediaNaturalWidth / mediaNaturalHeight;
    
    // Check if this is a positioned image or video (has imageSizePercent)
    const currentItem = normalized[cardIndex];
    const hasPositionedImage = currentItem?.imageSizePercent != null && currentItem?.imageUrl;
    const hasPositionedVideo = currentItem?.imageSizePercent != null && currentItem?.videoUrl;
    const hasPositionedMedia = hasPositionedImage || hasPositionedVideo;
    
    if (hasPositionedMedia) {
      // For positioned images, animate the container size
      const maxFinalWidth = Math.min(1280, viewportWidth - 32 - 80 - 8);
      const maxFinalHeight = viewportHeight * 0.9;
      // Calculate dimensions to maintain 16:9 aspect ratio
      const finalWidth = Math.min(maxFinalWidth, maxFinalHeight * 16 / 9);
      const finalHeight = finalWidth * 9 / 16;
      
      return {
        x: initialX - finalX, // Offset from center
        y: initialY - finalY, // Offset from center
        width: containerRect.width, // Use container rect for animation
        height: containerRect.height, // Use container rect for animation
        finalWidth: finalWidth,
        finalHeight: finalHeight,
      };
    } else {
      // For full-cover images, use existing logic
    // Calculate scale factors
    // Final size: max-w-7xl (1280px) or max-h-[90vh], whichever is smaller
    // Account for: 32px padding + 80px buttons (40px each) + 8px gaps (4px each side)
    const maxFinalWidth = Math.min(1280, viewportWidth - 32 - 80 - 8);
    const maxFinalHeight = viewportHeight * 0.9;
    
    // Determine final rendered dimensions based on media aspect ratio and container constraints
    // This simulates what object-contain will do
    let finalRenderedWidth, finalRenderedHeight;
    if (maxFinalWidth / maxFinalHeight > mediaAspectRatio) {
      // Height is the limiting factor
      finalRenderedHeight = maxFinalHeight;
      finalRenderedWidth = finalRenderedHeight * mediaAspectRatio;
    } else {
      // Width is the limiting factor
      finalRenderedWidth = maxFinalWidth;
      finalRenderedHeight = finalRenderedWidth / mediaAspectRatio;
    }
    
    // Calculate offset from viewport center (where the media will be centered)
    const offsetX = initialX - finalX;
    const offsetY = initialY - finalY;
    
    return {
      x: offsetX, // Offset from center
      y: offsetY, // Offset from center
        width: mediaRect.width, // Use media rect for full-cover
        height: mediaRect.height, // Use media rect for full-cover
      finalWidth: finalRenderedWidth,
      finalHeight: finalRenderedHeight,
    };
    }
  }, [normalized]);

  const { cardWidth: effWidth, cardHeight: effHeight, gap: effGap } = useResponsiveSizing(
    cardWidth,
    cardHeight,
    gap
  );

  const span = effWidth + effGap;
  const centerOffset = useMemo(
    () => span * (normalized.length - 1) * 0.5,
    [span, normalized.length]
  );

  const setIndex = useCallback(
    (next) => {
      const last = normalized.length - 1;
      const clamped = Math.max(0, Math.min(next, last));
      if (!isControlled) setUncontrolledIndex(clamped);
      onChange?.(clamped);
    },
    [isControlled, normalized.length, onChange]
  );

  // Lightbox callbacks (defined after setIndex)
  const openLightbox = useCallback((i) => {
    if (!effectiveLightboxEnabled) return;
    
    // FIX 2: Set pending index to trigger scroll lock, then calculate transform after layout stabilizes
    setLightboxIndex(i);
    setIndex(i);
    setPendingLightboxIndex(i); // This triggers scroll lock effect, then transform calculation
  }, [effectiveLightboxEnabled, setIndex]);

  const prevLightbox = useCallback(() => {
    const newIndex = Math.max(0, lightboxIndex - 1);
    setLightboxIndex(newIndex);
    // Sync carousel index with lightbox index
    setIndex(newIndex);
  }, [lightboxIndex, setIndex]);
  
  const nextLightbox = useCallback(() => {
    const newIndex = Math.min(normalized.length - 1, lightboxIndex + 1);
    setLightboxIndex(newIndex);
    // Sync carousel index with lightbox index
    setIndex(newIndex);
  }, [lightboxIndex, normalized.length, setIndex]);

  const closeLightbox = useCallback(() => {
    // Since carousel index is synced with lightbox index, no sliding needed
    // Just animate back to the current card position
    const transform = calculateCardTransform(lightboxIndex);
    if (transform) {
      // Apply same scrollbar gutter compensation as opening
      // When scroll lock is removed, the gutter will reappear and content shifts left
      const scrollbarGutter = scrollbarGutterRef.current;
      if (scrollbarGutter > 0) {
        transform.x = transform.x + scrollbarGutter / 2;
      }
      setExitTransform(transform);
      setExitDuration(0.4); // Fixed duration since no sliding
      // Use requestAnimationFrame to ensure state is updated before exit animation
      requestAnimationFrame(() => {
        setLightboxOpen(false);
      });
    } else {
      setLightboxOpen(false);
    }
    // Reset transform after animation completes
    setTimeout(() => {
      setInitialTransform(null);
      setExitTransform(null);
      setExitDuration(0.4);
    }, 400);
  }, [lightboxIndex, calculateCardTransform]);

  // FIX 2: Measure BEFORE scroll lock, then apply scroll lock and open lightbox
  useEffect(() => {
    if (pendingLightboxIndex === null) return;
    
    // Step 1: Measure scrollbar gutter BEFORE scroll lock (this is the key fix!)
    const scrollbarGutterBeforeLock = window.innerWidth - document.documentElement.clientWidth;
    scrollbarGutterRef.current = scrollbarGutterBeforeLock; // Store for exit animation
    
    // Step 2: Calculate transform BEFORE scroll lock (card position is accurate)
    const transform = calculateCardTransform(pendingLightboxIndex);
    
    // Step 3: Adjust transform to compensate for scrollbar gutter that will disappear
    if (transform && scrollbarGutterBeforeLock > 0) {
      // When scroll lock is applied, content shifts right by half the gutter
      // The lightbox stays centered, so we need to adjust the starting x position
      transform.x = transform.x + scrollbarGutterBeforeLock / 2;
    }
    
    // Step 4: Apply scroll lock
    const scrollY = window.scrollY;
    const body = document.body;
    
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    
    // Step 5: Open lightbox with pre-calculated transform
    setInitialTransform(transform);
    setLightboxOpen(true);
    setPendingLightboxIndex(null);
  }, [pendingLightboxIndex, calculateCardTransform]);

  // After the entrance animation completes, clear the initial transform so the lightbox can resize responsively
  useEffect(() => {
    if (!isLightboxOpen || !initialTransform) return;

    const timer = setTimeout(() => {
      setInitialTransform(null);
    }, 500);

    return () => clearTimeout(timer);
  }, [isLightboxOpen, initialTransform]);

  // Restore scroll when lightbox closes (scroll lock is applied in pendingLightboxIndex effect)
  useEffect(() => {
    if (!effectiveLightboxEnabled) return;
    
    // Only handle cleanup - scroll lock is applied when pendingLightboxIndex is set
    if (isLightboxOpen) {
      // Capture scroll position from body.style.top
      const scrollY = parseInt(document.body.style.top || '0', 10) * -1;
      
      return () => {
        // When closing, wait for exit animation to complete before restoring scroll
        const savedScrollY = scrollY;
        const animationDuration = exitDuration * 1000;
        setTimeout(() => {
          const body = document.body;
          body.style.position = '';
          body.style.top = '';
          body.style.width = '';
          body.style.overflow = '';
          window.scrollTo(0, savedScrollY);
        }, animationDuration);
      };
    }
  }, [effectiveLightboxEnabled, isLightboxOpen, exitDuration]);

  // Keyboard handler for lightbox (defined after callbacks)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e) => {
      // Only handle lightbox navigation keys
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        prevLightbox();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        nextLightbox();
      }
    };
    if (typeof window !== 'undefined') {
      // Use capture phase to intercept before carousel handler
      window.addEventListener("keydown", onKey, true);
      return () => window.removeEventListener("keydown", onKey, true);
    }
  }, [isLightboxOpen, closeLightbox, prevLightbox, nextLightbox]);

  const xOffset = useMemo(
    () => -index * span + centerOffset,
    [index, span, centerOffset]
  );

  const onKeyDown = (e) => {
    // Disable keyboard navigation when lightbox is open
    if (isLightboxOpen) return;
    // Disable keyboard navigation in mobile/vertical mode
    if (isMobile) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex(Math.min(index + 1, normalized.length - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex(Math.max(index - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(normalized.length - 1);
    }
  };

  const onWheel = (e) => {
    // Disable wheel navigation in mobile/vertical mode
    if (isMobile || !wheelToNavigate) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
    if (delta > 20) setIndex(index + 1);
    else if (delta < -20) setIndex(index - 1);
  };

  return (
    <div
      className={`relative flex h-auto py-1 md:py-3 w-full flex-col items-center justify-center ${className}`}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      tabIndex={0}
    >
      <div className="flex flex-col items-center justify-center w-full">
        {isMobile ? (
          // Vertical layout for mobile (< 640px)
          <div className="flex flex-col items-center w-full" style={{ rowGap: Math.max(effGap * 3, 24), width: '100%' }}>
            {normalized.map((item, i) => (
              <div key={i} className="w-full flex flex-col items-center px-4">
                <div style={{ width: '100%', maxWidth: effWidth }}>
                  <CarouselCard
                    item={item}
                    index={i}
                    currentIndex={index}
                    effWidth={effWidth}
                    isHydrated={isHydrated}
                    isDarkMode={isDarkMode}
                    effectiveLightboxEnabled={false} // No lightbox in mobile
                    openLightboxOnCardClick={openLightboxOnCardClick}
                    openLightbox={openLightbox}
                    setIndex={setIndex}
                    renderCard={renderCard}
                    renderCaption={renderCaption}
                    captionStyle={captionStyle}
                    transition={transition}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Horizontal carousel layout for >= 640px
          <motion.div
            initial={false}
            className="flex justify-start"
            style={{ columnGap: effGap }}
            animate={{ x: xOffset }}
            transition={transition}
            {...(enableDrag
              ? {
                  drag: "x",
                  dragConstraints: { left: -100000, right: 100000 },
                  dragElastic: 0.1,
                  dragMomentum: false,
                  onDragEnd: (_, info) => {
                    const delta = info.offset.x;
                    const vx = info.velocity.x;
                    const passed = Math.abs(delta) > span * swipeThreshold;
                    let next = index;
                    if (delta < 0) {
                      if (passed || vx < -velocityThreshold)
                        next = Math.min(index + 1, normalized.length - 1);
                    } else if (delta > 0) {
                      if (passed || vx > velocityThreshold)
                        next = Math.max(index - 1, 0);
                    }
                    setIndex(next);
                  },
                }
              : {})}
          >
            {normalized.map((item, i) => (
              <CarouselCard
                key={i}
                item={item}
                index={i}
                currentIndex={index}
                effWidth={effWidth}
                isHydrated={isHydrated}
                isDarkMode={isDarkMode}
                effectiveLightboxEnabled={effectiveLightboxEnabled}
                openLightboxOnCardClick={openLightboxOnCardClick}
                openLightbox={openLightbox}
                setIndex={setIndex}
                cardRef={(el) => {
                  if (effectiveLightboxEnabled && (item.imageUrl || item.videoUrl)) {
                      cardRefs.current[i] = el;
                    }
                  }}
                renderCard={renderCard}
                renderCaption={renderCaption}
                captionStyle={captionStyle}
                  transition={transition}
              />
            ))}
          </motion.div>
        )}

        {/* Indicators - hidden in mobile/vertical mode */}
        {showIndicators && !isMobile && (
          <CarouselIndicators
            normalized={normalized}
            index={index}
            setIndex={setIndex}
            indicatorExpandedWidth={indicatorExpandedWidth}
            indicatorCollapsedSize={indicatorCollapsedSize}
            indicatorHeight={indicatorHeight}
                    transition={transition}
          />
        )}
      </div>

      <Lightbox
        isOpen={effectiveLightboxEnabled && isLightboxOpen}
        closeLightbox={closeLightbox}
        prevLightbox={prevLightbox}
        nextLightbox={nextLightbox}
        lightboxIndex={lightboxIndex}
        normalizedItems={normalized}
        initialTransform={initialTransform}
        exitTransform={exitTransform}
        exitDuration={exitDuration}
        isDarkMode={isDarkMode}
        isLgOrAbove={isLgOrAbove}
      />
    </div>
  );
}
