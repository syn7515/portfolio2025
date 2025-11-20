import { useState, useEffect } from "react";

export const FALLBACK_ITEMS = ["Dean", "Lil B", "Lazer", "Simz", "Bladee"];

export function normalizeItem(item: any) {
  if (typeof item === "string") return { label: item, caption: null, imageUrl: null, videoUrl: null, alt: item, imageSizePercent: null, imagePosition: null, videoAutoplay: true, videoLoop: true, videoMuted: true, videoControls: false };
  if (item && typeof item === "object") {
    if ("label" in item || "imageUrl" in item || "videoUrl" in item) {
      const hasVideo = !!(item.videoUrl ?? item.video);
      return { 
        label: item.label ?? "", 
        caption: item.caption ?? null,
        imageUrl: item.imageUrl ?? item.image ?? null, // allow image alias
        videoUrl: item.videoUrl ?? item.video ?? null, // allow video alias
        alt: item.alt ?? item.label ?? "",
        imageSizePercent: item.imageSizePercent ?? null,
        imagePosition: item.imagePosition ?? null,
        videoAutoplay: item.videoAutoplay ?? (hasVideo ? true : false),
        videoLoop: item.videoLoop ?? true,
        videoMuted: item.videoMuted ?? true,
        videoControls: item.videoControls ?? false
      };
    }
    const keys = Object.keys(item);
    if (keys.length > 0) {
      const k = keys[0];
      return { label: k, caption: item[k] ?? null, imageUrl: null, videoUrl: null, alt: k, imageSizePercent: null, imagePosition: null, videoAutoplay: true, videoLoop: true, videoMuted: true, videoControls: false };
    }
  }
  return { label: String(item), caption: null, imageUrl: null, videoUrl: null, alt: String(item), imageSizePercent: null, imagePosition: null, videoAutoplay: true, videoLoop: true, videoMuted: true, videoControls: false };
}

export function calculateImagePosition(imagePosition: any, containerWidth: number, containerHeight: number) {
  if (!imagePosition) return {};
  
  const style: any = {};
  const transforms = [];
  
  // Handle horizontal positioning
  if (imagePosition.left === 'center') {
    style.left = '50%';
    transforms.push('translateX(-50%)');
  } else if (imagePosition.left != null) {
    style.left = `${imagePosition.left}%`;
  } else if (imagePosition.right != null) {
    style.right = `${imagePosition.right}%`;
  }
  
  // Handle vertical positioning
  if (imagePosition.top === 'center') {
    style.top = '50%';
    transforms.push('translateY(-50%)');
  } else if (imagePosition.top != null) {
    style.top = `${imagePosition.top}%`;
  } else if (imagePosition.bottom != null) {
    style.bottom = `${imagePosition.bottom}%`;
  }
  
  // Combine transforms if both center
  if (transforms.length > 0) {
    style.transform = transforms.join(' ');
  }
  
  return style;
}

export function useResponsiveSizing(explicitWidth?: number, explicitHeight?: number, explicitGap?: number) {
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

export function useLightboxDimensions() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const maxContainerWidth = Math.min(1280, viewportWidth - 32 - 80 - 8);
      const maxContainerHeight = viewportHeight * 0.9;
      // Calculate dimensions to maintain 16:9 aspect ratio
      const containerWidth = Math.min(maxContainerWidth, maxContainerHeight * 16 / 9);
      const containerHeight = containerWidth * 9 / 16;
      
      setDimensions({ width: containerWidth, height: containerHeight });
    };

    // Initial calculation
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

