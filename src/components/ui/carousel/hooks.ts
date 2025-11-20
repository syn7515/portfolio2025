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

export function useResponsiveSizing(
  explicitWidth?: number,
  explicitHeight?: number,
  explicitGap?: number
) {
  const [size, setSize] = useState(() => ({
    cardWidth: explicitWidth ?? 0,
    cardHeight: explicitHeight ?? 0,
    gap: explicitGap ?? 0,
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
        const height = 473;
        setSize({ cardWidth: width, cardHeight: height, gap: 36 });
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

export function useLightboxDimensions() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const maxContainerWidth = Math.min(1280, viewportWidth - 32 - 80 - 8);
      const maxContainerHeight = viewportHeight * 0.9;
      const containerWidth = Math.min(
        maxContainerWidth,
        (maxContainerHeight * 16) / 9
      );
      const containerHeight = (containerWidth * 9) / 16;

      setDimensions({ width: containerWidth, height: containerHeight });
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return dimensions;
}

