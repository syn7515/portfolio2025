"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

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
  transition = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
}: ProjectItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={initial}
      animate={animate}
      transition={transition}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href={href} 
        className="block group font-sans"
        style={{ 
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        <div className="relative">
          <img
            src={imageUrl}
            alt={`${organization} project screenshot`}
            className="w-full object-cover"
          />
          {/* Overlay with 10% opacity black on hover */}
          <div
            className={`absolute inset-0 bg-black transition-opacity ${
              isHovered ? 'opacity-10' : 'opacity-0'
            }`}
          />
        </div>
        <div className="mt-4 font-sans not-italic">
          <div className="text-[13px] text-stone-500 dark:text-stone-400 font-normal not-italic" style={{ fontFamily: 'Inter' }}>
            {organization} · <span>{dates}</span>
          </div>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 mt-0.5 not-italic">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

