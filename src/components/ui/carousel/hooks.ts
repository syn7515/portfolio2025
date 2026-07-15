import type { CSSProperties } from "react";
import { useState, useEffect } from "react";

export const FALLBACK_ITEMS = ["Dean", "Lil B", "Lazer", "Simz", "Bladee"];

export type ImagePosition = {
  top?: number | "center";
  left?: number | "center";
  bottom?: number;
  right?: number;
};

export type CarouselItem = {
  label: string;
  caption: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  alt: string;
  imageSizePercent: number | null;
  imagePosition: ImagePosition | null;
  videoAutoplay: boolean;
  videoLoop: boolean;
  videoMuted: boolean;
  videoControls: boolean;
  cardVariant?: "default" | "with-background-lines";
  backgroundLines?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  withInsetShadow?: boolean;
};

type Normalizable =
  | string
  | (Partial<CarouselItem> & Record<string, unknown>);

const DEFAULT_ITEM: CarouselItem = {
  label: "",
  caption: null,
  imageUrl: null,
  videoUrl: null,
  alt: "",
  imageSizePercent: null,
  imagePosition: null,
  videoAutoplay: true,
  videoLoop: true,
  videoMuted: true,
  videoControls: false,
  cardVariant: "default",
  backgroundLines: undefined,
  fetchPriority: 'auto',
};

export function normalizeItem(item: Normalizable): CarouselItem {
  if (typeof item === "string") {
    return {
      ...DEFAULT_ITEM,
      label: item,
      alt: item,
    };
  }

  if (item && typeof item === "object") {
    if ("label" in item || "imageUrl" in item || "videoUrl" in item) {
      const hasVideo = Boolean(item.videoUrl ?? item.video);
      return {
        ...DEFAULT_ITEM,
        label: typeof item.label === "string" ? item.label : "",
        caption: typeof item.caption === "string" ? item.caption : null,
        imageUrl:
          (typeof item.imageUrl === "string" && item.imageUrl) ||
          (typeof item.image === "string" && item.image) ||
          null,
        videoUrl:
          (typeof item.videoUrl === "string" && item.videoUrl) ||
          (typeof item.video === "string" && item.video) ||
          null,
        alt: (
          (typeof item.alt === "string" && item.alt) ||
          (typeof item.label === "string" && item.label) ||
          ""
        ),
        imageSizePercent:
          typeof item.imageSizePercent === "number"
            ? item.imageSizePercent
            : null,
        imagePosition:
          (item.imagePosition as ImagePosition | null | undefined) ?? null,
        videoAutoplay:
          typeof item.videoAutoplay === "boolean"
            ? item.videoAutoplay
            : hasVideo,
        videoLoop:
          typeof item.videoLoop === "boolean" ? item.videoLoop : true,
        videoMuted:
          typeof item.videoMuted === "boolean" ? item.videoMuted : true,
        videoControls:
          typeof item.videoControls === "boolean" ? item.videoControls : false,
        cardVariant:
          item.cardVariant === "with-background-lines"
            ? "with-background-lines"
            : "default",
        backgroundLines:
          typeof item.backgroundLines === "string" ? item.backgroundLines : undefined,
        fetchPriority:
          item.fetchPriority === 'high' || item.fetchPriority === 'low' || item.fetchPriority === 'auto'
            ? item.fetchPriority
            : 'auto',
        withInsetShadow: item.withInsetShadow === true ? true : undefined,
      };
    }

    const keys = Object.keys(item);
    if (keys.length > 0) {
      const fallbackLabel = keys[0];
      const value = item[fallbackLabel];
      return {
        ...DEFAULT_ITEM,
        label: fallbackLabel,
        caption:
          typeof value === "string" || value === null ? (value as string | null) : null,
        alt: fallbackLabel,
      };
    }
  }

  return {
    ...DEFAULT_ITEM,
    label: String(item),
    alt: String(item),
  };
}

export function calculateImagePosition(
  imagePosition?: ImagePosition | null
): CSSProperties {
  if (!imagePosition) return {};

  const style: CSSProperties = {};
  const transforms: string[] = [];

  if (imagePosition.left === "center") {
    style.left = "50%";
    transforms.push("translateX(-50%)");
  } else if (typeof imagePosition.left === "number") {
    style.left = `${imagePosition.left}%`;
  } else if (typeof imagePosition.right === "number") {
    style.right = `${imagePosition.right}%`;
  }

  if (imagePosition.top === "center") {
    style.top = "50%";
    transforms.push("translateY(-50%)");
  } else if (typeof imagePosition.top === "number") {
    style.top = `${imagePosition.top}%`;
  } else if (typeof imagePosition.bottom === "number") {
    style.bottom = `${imagePosition.bottom}%`;
  }

  if (transforms.length > 0) {
    style.transform = transforms.join(" ");
  }

  return style;
}

// Minimum gap kept between a card's left edge and the paper's left edge at ≥1280px,
// where the paper is inset by --sidebar-w but cards center on the viewport.
const CARD_EDGE_GAP = 48;

export function useResponsiveSizing(
  explicitWidth?: number,
  explicitHeight?: number,
  explicitGap?: number
) {
  const [size, setSize] = useState(() => ({
    cardWidth: explicitWidth ?? 0,
    cardHeight: explicitHeight ?? 0,
    gap: explicitGap ?? 0,
    offsetX: 0,
  }));

  useEffect(() => {
    if (
      explicitWidth != null &&
      explicitHeight != null &&
      explicitGap != null
    ) {
      setSize({
        cardWidth: explicitWidth,
        cardHeight: explicitHeight,
        gap: explicitGap,
        offsetX: 0,
      });
      return;
    }

    const compute = () => {
      if (typeof window === "undefined") return;
      const w = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );

      if (w < 640) {
        const width = Math.max(120, w - 40);
        const height = Math.round((width * 9) / 16);
        setSize({ cardWidth: width, cardHeight: height, gap: 8, offsetX: 0 });
      } else if (w < 768) {
        const width = Math.max(
          600,
          Math.min(640, Math.round(600 + ((w - 640) / (768 - 640)) * 40))
        );
        const height = Math.round((width * 9) / 16);
        setSize({ cardWidth: width, cardHeight: height, gap: 12, offsetX: 0 });
      } else if (w < 1024) {
        const width = 640;
        const height = 360;
        setSize({ cardWidth: width, cardHeight: height, gap: 16, offsetX: 0 });
      } else if (w < 1280) {
        setSize({ cardWidth: 840, cardHeight: 473, gap: 36, offsetX: 0 });
      } else {
        const t = Math.min(1, (w - 1280) / 220); // 0 at 1280px → 1 at 1500px+
        const idealWidth = Math.round(720 + t * 240); // 720px → 960px
        // The paper surface is inset from the left by --sidebar-w (see globals.css:
        // clamp(240px, 27.273vw - 109.09px, 300px)) while cards center on the viewport,
        // so a wide card can run off the paper's left edge. Keep the card full-size and
        // shift it right (offsetX) just enough to hold CARD_EDGE_GAP from that edge;
        // only shrink if the paper itself is too narrow (defensive — doesn't happen at
        // these breakpoints).
        const sidebarW = Math.min(300, Math.max(240, 0.27273 * w - 109.09));
        const cardWidth = Math.min(idealWidth, Math.floor(w - sidebarW - CARD_EDGE_GAP * 2));
        const cardHeight = Math.round(cardWidth * 9 / 16);
        const offsetX = Math.max(0, Math.round(sidebarW + CARD_EDGE_GAP - (w - cardWidth) / 2));
        setSize({ cardWidth, cardHeight, gap: 40, offsetX });
      }
    };

    compute();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }
  }, [explicitWidth, explicitHeight, explicitGap]);

  return size;
}

// Prev/next buttons are 48px in diameter (p-3 padding + w-6 h-6 icon) once the
// lightbox is enabled (>=768px viewport), and sit `buttonGap` away from the
// media edge — 4px below the lg breakpoint, 16px at lg+ (see lightbox.tsx).
// The reserved space must grow with that gap so the buttons keep breathing
// room from the viewport edge instead of being pushed flush against it.
const LIGHTBOX_OUTER_PADDING = 16;
const LIGHTBOX_BUTTON_DIAMETER = 48;

export function getLightboxMaxWidth(viewportWidth: number): number {
  const isLgOrAbove = viewportWidth >= 1024;
  const buttonGap = isLgOrAbove ? 16 : 4;
  const reserved = (LIGHTBOX_OUTER_PADDING + buttonGap + LIGHTBOX_BUTTON_DIAMETER) * 2;
  return Math.min(1280, viewportWidth - reserved);
}

export function useLightboxDimensions() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const containerWidth = getLightboxMaxWidth(viewportWidth);
      const containerHeight = (containerWidth * 9) / 16;

      setDimensions({ width: containerWidth, height: containerHeight });
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return dimensions;
}
