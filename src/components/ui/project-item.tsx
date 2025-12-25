"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ProjectItemProps {
  imageUrl: string;
  organization: string;
  dates: string;
  description: string;
  href: string;
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  transition?: { duration: number; ease: [number, number, number, number]; delay?: number };
}

export default function ProjectItem({
  imageUrl,
  organization,
  dates,
  description,
  href,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] },
}: ProjectItemProps) {
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
        className="block group font-sans cursor-pointer"
        style={{ 
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        <div className="relative w-full aspect-video bg-stone-200/60 dark:bg-zinc-700/80 group-hover:bg-stone-300 dark:group-hover:bg-zinc-600 transition-colors duration-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${organization} project screenshot`}
            className="absolute object-cover"
            style={{
              left: '12.5%',
              top: '12.5%',
              width: '88%',
              height: '88%',
              objectPosition: 'left top',
            }}
          />
          {/* Border layer on top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: isHydrated ? (isDarkMode ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.06)') : '1px solid rgba(0, 0, 0, 0.06)',
              boxSizing: 'border-box',
              zIndex: 10
            }}
          />
        </div>
        <div className="mt-4 font-sans not-italic">
          <div className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic" style={{ fontFamily: 'Inter' }}>
            {organization} · <span>{dates}</span>
          </div>
          <p className="mt-0.5 not-italic !text-stone-700 dark:!text-zinc-300">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

