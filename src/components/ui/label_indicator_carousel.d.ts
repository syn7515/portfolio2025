import * as React from "react";

export type CarouselItem = string | { label: string; caption?: string; imageUrl?: string };

export interface LabelIndicatorCarouselProps {
  items?: CarouselItem[];
  currentIndex?: number;
  defaultIndex?: number;
  onChange?: (i: number) => void;
  cardWidth?: number;
  cardHeight?: number;
  gap?: number;
  renderCard?: (index: number, active: boolean, item: { label: string; caption?: string | null; imageUrl?: string }) => React.ReactNode;
  renderCaption?: (args: {
    index: number;
    label: string;
    caption?: string | null;
    active: boolean;
  }) => React.ReactNode;
  captionStyle?: React.CSSProperties;
  transition?: { type: string; stiffness: number; damping: number };
  indicatorExpandedWidth?: number;
  indicatorCollapsedSize?: number;
  indicatorHeight?: number;
  withEdgeBlur?: boolean;
  ariaLabel?: string;
  className?: string;
  enableDrag?: boolean;
  swipeThreshold?: number;
  velocityThreshold?: number;
  wheelToNavigate?: boolean;
}

declare const LabelIndicatorCarousel: React.FC<LabelIndicatorCarouselProps>;
export default LabelIndicatorCarousel;


