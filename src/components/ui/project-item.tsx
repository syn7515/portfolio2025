"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ProjectItemProps {
  imageUrl: string;
  alt: string;
  organization: string;
  dates: string;
  description: string;
  href: string;
  /** Image position as CSS object-position (e.g. 'center center'). Default: 'left top' */
  imageObjectPosition?: string;
  /** Image size as percentage (e.g. '90'). Default: 88 with left/top 12.5 for framing. */
  imageSizePercent?: number;
  /** 'contain' = show full image (no crop); 'cover' = fill frame (may crop). Default: 'cover' */
  imageObjectFit?: 'cover' | 'contain';
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  initial?: { opacity: number; y: number; filter?: string } | false;
  animate?: { opacity: number; y: number; filter?: string };
  transition?: { duration: number; ease: [number, number, number, number]; delay?: number };
}

export default function ProjectItem({
  imageUrl,
  alt,
  organization,
  dates,
  description,
  href,
  imageObjectPosition = 'left top',
  imageSizePercent,
  imageObjectFit = 'cover',
  loading = 'eager',
  fetchPriority = 'auto',
  initial,
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] },
}: ProjectItemProps) {
  const size = imageSizePercent != null ? imageSizePercent : 88;
  const inset = imageSizePercent != null ? (100 - imageSizePercent) / 2 : 12.5;
  // Dark mode detection - only set after hydration to avoid SSR mismatch
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setIsDarkMode(document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  return (
    <motion.div
      className="w-full"
      initial={initial}
      animate={animate}
      transition={transition}
    >
      <Link
        href={href}
        className="flex flex-col group font-sans cursor-pointer"
        style={{ 
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        <div className="relative w-full aspect-video bg-stone-200/50 dark:bg-zinc-800/70 dark:group-hover:bg-zinc-800 group-hover:bg-stone-200 transition-colors duration-300 ease-out overflow-hidden lg:rounded-xl lg:order-2">
          <img
            src={imageUrl}
            alt={alt}
            className="absolute"
            loading={loading}
            fetchPriority={fetchPriority}
            style={{
              left: `${inset}%`,
              top: `${inset}%`,
              width: `${size}%`,
              height: `${size}%`,
              objectFit: imageObjectFit,
              objectPosition: imageObjectPosition,
            }}
          />
          {/* Border layer on top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: isHydrated && !isDarkMode ? '1px solid rgba(0, 0, 0, 0.02)' : 'none',
              boxSizing: 'border-box',
              zIndex: 10
            }}
          />
        </div>
        <div className="mt-4 lg:order-1 lg:mt-0 lg:mb-4 font-sans not-italic lg:grid lg:grid-cols-[268px_500px] lg:items-baseline">
          <div className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic font-sans !font-[420] lg:px-2">
            <span className="flex gap-2 items-center">{organization}<span className="text-stone-400 dark:text-zinc-600">·</span><span>{dates}</span></span>
          </div>
          <h2 className="!text-base !font-[420] !mt-0.5 !mb-0 not-italic !text-stone-800 dark:!text-zinc-200 leading-normal">
            {description}
          </h2>
        </div>
      </Link>
    </motion.div>
  );
}

