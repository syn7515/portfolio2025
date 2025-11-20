"use client"

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface CarouselIndicatorsProps {
  normalized: any[];
  index: number;
  setIndex: (index: number) => void;
  indicatorExpandedWidth?: number;
  indicatorCollapsedSize?: number;
  indicatorHeight?: number;
  transition?: any;
}

export function CarouselIndicators({
  normalized,
  index,
  setIndex,
  indicatorExpandedWidth,
  indicatorCollapsedSize,
  indicatorHeight,
  transition
}: CarouselIndicatorsProps) {
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

  return (
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
  );
}

