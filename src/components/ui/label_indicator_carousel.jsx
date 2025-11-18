"use client"

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

// LabelIndicatorCarousel Component (Responsive)
// - Responsive sizing defaults by viewport unless overridden by props
// - Responsive text sizing for captions: text-xs sm:text-sm

const defaultTransition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

const FALLBACK_ITEMS = ["Dean", "Lil B", "Lazer", "Simz", "Bladee"];

function normalizeItem(item) {
  if (typeof item === "string") return { label: item, caption: null, imageUrl: null, alt: item };
  if (item && typeof item === "object") {
    if ("label" in item || "imageUrl" in item) {
      return { 
        label: item.label ?? "", 
        caption: item.caption ?? null,
        imageUrl: item.imageUrl ?? item.image ?? null, // allow image alias
        alt: item.alt ?? item.label ?? ""
      };
    }
    const keys = Object.keys(item);
    if (keys.length > 0) {
      const k = keys[0];
      return { label: k, caption: item[k] ?? null, imageUrl: null, alt: k };
    }
  }
  return { label: String(item), caption: null, imageUrl: null, alt: String(item) };
}

function useResponsiveSizing(explicitWidth, explicitHeight, explicitGap) {
  const [size, setSize] = useState(() => ({
    cardWidth: explicitWidth ?? 0,
    cardHeight: explicitHeight ?? 0,
    gap: explicitGap ?? 0,
  }));

  useEffect(() => {
    if (explicitWidth != null && explicitHeight != null && explicitGap != null) {
      setSize({ cardWidth: explicitWidth, cardHeight: explicitHeight, gap: explicitGap });
      return;
    }

    const compute = () => {
      if (typeof window === 'undefined') return;
      const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

      if (w < 640) {
        const width = Math.max(120, w - 40);
        const height = Math.round((width * 9) / 16);
        setSize({ cardWidth: width, cardHeight: height, gap: 8 });
      } else if (w < 768) {
        const width = 520;
        const height = Math.round((width * 9) / 16);
        setSize({ cardWidth: width, cardHeight: height, gap: 12 });
      } else if (w < 1024) {
        const width = 640;
        const height = 360;
        setSize({ cardWidth: width, cardHeight: height, gap: 16 });
      } else {
        const width = 840;
        const height = 473; // Maintains 16:9 ratio (840 * 9/16 = 472.5)
        setSize({ cardWidth: width, cardHeight: height, gap: 36 });
      }
    };

    compute();
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }
  }, [explicitWidth, explicitHeight, explicitGap]);

  return size;
}

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

  // Lightbox state
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(index);
  const [initialTransform, setInitialTransform] = useState(null);
  const [exitTransform, setExitTransform] = useState(null);
  const [exitDuration, setExitDuration] = useState(0.4);
  const cardRefs = useRef({});
  
  // Disable lightbox on mobile (< 640px) and sm and below
  const effectiveLightboxEnabled = enableLightbox && !isMobile && !isSmOrBelow;

  const calculateCardTransform = useCallback((cardIndex) => {
    const cardElement = cardRefs.current[cardIndex];
    if (!cardElement) return null;

    // Get the actual image element inside the card
    const imageElement = cardElement.querySelector('img');
    if (!imageElement) return null;

    // Get bounding rect of the image element (not the container)
    const imageRect = imageElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate final position (center of viewport)
    const finalX = viewportWidth / 2;
    const finalY = viewportHeight / 2;
    
    // Calculate initial position (center of visible image)
    const initialX = imageRect.left + imageRect.width / 2;
    const initialY = imageRect.top + imageRect.height / 2;
    
    // Get natural image dimensions
    let imageNaturalWidth = imageRect.width;
    let imageNaturalHeight = imageRect.height;
    
    if (imageElement.complete) {
      imageNaturalWidth = imageElement.naturalWidth;
      imageNaturalHeight = imageElement.naturalHeight;
    }
    
    // Calculate the image's natural aspect ratio
    const imageAspectRatio = imageNaturalWidth / imageNaturalHeight;
    
    // Calculate scale factors
    // Final size: max-w-7xl (1280px) or max-h-[90vh], whichever is smaller
    // Account for: 32px padding + 80px buttons (40px each) + 8px gaps (4px each side)
    const maxFinalWidth = Math.min(1280, viewportWidth - 32 - 80 - 8);
    const maxFinalHeight = viewportHeight * 0.9;
    
    // Determine final rendered dimensions based on image aspect ratio and container constraints
    // This simulates what object-contain will do
    let finalRenderedWidth, finalRenderedHeight;
    if (maxFinalWidth / maxFinalHeight > imageAspectRatio) {
      // Height is the limiting factor
      finalRenderedHeight = maxFinalHeight;
      finalRenderedWidth = finalRenderedHeight * imageAspectRatio;
    } else {
      // Width is the limiting factor
      finalRenderedWidth = maxFinalWidth;
      finalRenderedHeight = finalRenderedWidth / imageAspectRatio;
    }
    
    // Calculate offset from viewport center (where the image will be centered)
    const offsetX = initialX - finalX;
    const offsetY = initialY - finalY;
    
    return {
      x: offsetX, // Offset from center
      y: offsetY, // Offset from center
      width: imageRect.width, // Use image rect, not container rect
      height: imageRect.height, // Use image rect, not container rect
      finalWidth: finalRenderedWidth,
      finalHeight: finalRenderedHeight,
    };
  }, []);

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
    
    // Calculate transform from card position
    const transform = calculateCardTransform(i);
    setInitialTransform(transform);
    setLightboxIndex(i);
    // Sync carousel index with lightbox index
    setIndex(i);
    setLightboxOpen(true);
  }, [effectiveLightboxEnabled, calculateCardTransform, setIndex]);

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

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (!effectiveLightboxEnabled) return;
    
    if (isLightboxOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      const body = document.body;
      const html = document.documentElement;
      
      // Prevent scrolling by setting position fixed and maintaining scroll position
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      
      // Also prevent scrolling on html element
      html.style.overflow = 'hidden';
      
      // Store scroll position for restoration
      return () => {
        // When closing, wait for exit animation to complete before restoring scroll
        const savedScrollY = scrollY; // Capture scroll position in closure
        const animationDuration = exitDuration * 1000; // Convert to milliseconds
        setTimeout(() => {
          // Restore scroll position and styles
          body.style.position = '';
          body.style.top = '';
          body.style.width = '';
          body.style.overflow = '';
          html.style.overflow = '';
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

  // Responsive indicator sizes: base (<640px) vs sm and up (>=640px)
  const [effIndicators, setEffIndicators] = useState(() => ({
    expanded: indicatorExpandedWidth ?? 56,
    collapsed: indicatorCollapsedSize ?? 8,
    height: indicatorHeight ?? 20,
  }));

  useEffect(() => {
    // If all three provided explicitly, respect them and skip responsive behavior
    if (
      indicatorExpandedWidth != null &&
      indicatorCollapsedSize != null &&
      indicatorHeight != null
    ) {
      setEffIndicators({
        expanded: indicatorExpandedWidth,
        collapsed: indicatorCollapsedSize,
        height: indicatorHeight,
      });
      return;
    }

    const compute = () => {
      if (typeof window === 'undefined') return;
      const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const isSmUp = w >= 640; // Tailwind sm breakpoint
      setEffIndicators({
        expanded: indicatorExpandedWidth ?? (isSmUp ? 68 : 56),
        collapsed: indicatorCollapsedSize ?? (isSmUp ? 12 : 8),
        height: indicatorHeight ?? (isSmUp ? 26 : 20),
      });
    };
    compute();
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }
  }, [indicatorExpandedWidth, indicatorCollapsedSize, indicatorHeight]);

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
      className={`relative flex h-auto py-1 md:py-4 lg:py-8 w-full flex-col items-center justify-center ${className}`}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      tabIndex={0}
    >
      <div className="flex flex-col items-center justify-center">
        {isMobile ? (
          // Vertical layout for mobile (< 640px)
          <div className="flex flex-col items-center w-full" style={{ rowGap: Math.max(effGap * 3, 24) }}>
            {normalized.map((item, i) => {
              const { label, caption, imageUrl, alt } = item;
              return (
                <div key={i} className="flex flex-col items-center w-full px-4" style={{ maxWidth: '100%' }}>
                  <div
                    className="group relative bg-stone-200/60 transition-all duration-150 dark:bg-stone-800 w-full"
                    style={{ height: effHeight }}
                  >
                    {renderCard ? renderCard(i, i === index, item) : (
                      <div className="w-full h-full relative">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={alt ?? label}
                            className={`w-full h-full object-cover transition-opacity ${i !== index ? 'group-hover:opacity-70' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center">
                            <span className="text-stone-500 text-sm">{label}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {caption != null && caption !== "" ? (
                    renderCaption ? (
                      renderCaption({ index: i, label, caption, active: i === index })
                    ) : (
                      <div
                        className={`font-sans text-center text-stone-600 dark:text-zinc-300 text-xs sm:text-sm mt-2 sm:mt-3`}
                        style={{ width: "100%", ...(captionStyle || {}) }}
                      >
                        {caption}
                      </div>
                    )
                  ) : null}
                </div>
              );
            })}
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
            {normalized.map((item, i) => {
              const { label, caption, imageUrl, alt } = item;
              return (
              <div key={i} className="flex flex-col items-center" style={{ width: effWidth }}>
                <motion.div
                  ref={(el) => {
                    if (effectiveLightboxEnabled && imageUrl) {
                      cardRefs.current[i] = el;
                    }
                  }}
                  initial={false}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select card ${i + 1}${label ? `: ${label}` : ""}`}
                  onClick={() => {
                    if (i === index) {
                      if (openLightboxOnCardClick && effectiveLightboxEnabled) openLightbox(i);
                    } else {
                      setIndex(i);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (i === index) {
                        if (openLightboxOnCardClick && effectiveLightboxEnabled) openLightbox(i);
                      } else {
                        setIndex(i);
                      }
                    }
                  }}
                  className="group relative bg-stone-200/60 transition-all duration-150 dark:bg-stone-800 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                  style={{ width: "100%", height: effHeight }}
                  transition={transition}
                  whileTap={{ scale: 0.98 }}
                >
                  {renderCard ? renderCard(i, i === index, item) : (
                    <div className="w-full h-full relative overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={alt ?? label}
                          className={`w-full h-full object-cover transition-opacity ${i !== index ? 'group-hover:opacity-70' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center">
                          <span className="text-stone-500 text-sm">{label}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional top-right expand icon when lightbox enabled (hidden on sm and below) */}
                  {effectiveLightboxEnabled && i === index && imageUrl && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openLightbox(i); }}
                      className="hidden md:block absolute right-2 top-2 rounded-md bg-black/10 p-2 text-white backdrop-blur group-hover:bg-black/30 transition-colors"
                      aria-label="Open in lightbox"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>

                {caption != null && caption !== "" ? (
                  renderCaption ? (
                    renderCaption({ index: i, label, caption, active: i === index })
                  ) : (
                    <div
                      className={`font-sans text-center text-stone-600 dark:text-stone-300 text-xs sm:text-sm mt-2 sm:mt-3`}
                      style={{ width: "100%", ...(captionStyle || {}) }}
                    >
                      {caption}
                    </div>
                  )
                ) : null}
              </div>
              );
            })}
          </motion.div>
        )}

        {/* Indicators - hidden in mobile/vertical mode */}
        {showIndicators && !isMobile && (
          <div className="mt-4 sm:mt-8 flex h-8 items-center justify-center" style={{ columnGap: 8 }}>
            {normalized.map(({ label }, i) => {
              const active = index === i;
              return (
                <div key={i} onClick={() => setIndex(i)}>
                  <motion.button
                    type="button"
                    initial={false}
                    className="flex cursor-pointer select-none items-center justify-center overflow-hidden rounded-full bg-stone-100 text-xs sm:text-sm text-stone-500 outline-none ring-0 focus-visible:ring-2 focus-visible:ring-stone-400 dark:bg-zinc-800 dark:text-zinc-300"
                    animate={{
                      width: active ? effIndicators.expanded : effIndicators.collapsed,
                      height: active ? effIndicators.height : effIndicators.collapsed,
                    }}
                    transition={transition}
                    aria-current={active ? "true" : undefined}
                    aria-label={`Go to ${typeof label === "string" ? label : `item ${i + 1}`}`}
                  >
                    <motion.span
                      initial={false}
                      className="block whitespace-nowrap px-3 py-1"
                      animate={{
                        opacity: active ? 1 : 0,
                        scale: active ? 1 : 0,
                        filter: active ? "blur(0)" : "blur(4px)",
                        transformOrigin: "center",
                      }}
                      transition={transition}
                    >
                      {label}
                    </motion.span>
                  </motion.button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {effectiveLightboxEnabled && isLightboxOpen && (
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
                <div 
                  className="relative pointer-events-auto"
                  style={{ 
                    maxWidth: 'min(1280px, calc(100vw - 32px - 80px - 8px))',
                    maxHeight: '90vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.img
                    initial={initialTransform ? {
                      x: initialTransform.x,
                      y: initialTransform.y,
                      width: initialTransform.width,
                      height: initialTransform.height,
                    } : false}
                    animate={{
                      x: 0,
                      y: 0,
                      width: initialTransform ? initialTransform.finalWidth : 'auto',
                      height: initialTransform ? initialTransform.finalHeight : 'auto',
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
                    src={normalized[lightboxIndex]?.imageUrl || "/placeholder.svg"}
                    alt={normalized[lightboxIndex]?.alt || normalized[lightboxIndex]?.label || "Lightbox image"}
                    className="object-contain"
                    style={{ 
                      opacity: 1, 
                      display: 'block',
                      transformOrigin: 'center center',
                    }}
                  />
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
                      left: 'calc(50% - min(640px, calc(50vw - 16px - 40px - 4px)) - 4px)',
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
                    disabled={lightboxIndex >= normalized.length - 1}
                    className="absolute rounded-md p-1.5 sm:p-2 text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors z-20 pointer-events-auto"
                    style={{
                      left: 'calc(50% + min(640px, calc(50vw - 16px - 40px - 4px)) + 4px)',
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
    </div>
  );
}

// Example usage:
// <LabelIndicatorCarousel
//   items=[
//     { label: "Aurora", caption: "A dazzling display of natural light." },
//     { label: "Blaze", caption: "A fiery burst of energy and color." },
//     { label: "Cascade", caption: "Flowing gently like a mountain stream." },
//     { label: "Drift", caption: "Soft, quiet, and serene in motion." },
//     { label: "Echo", caption: "Repeating through the valleys of sound." }
//   ]
// />


