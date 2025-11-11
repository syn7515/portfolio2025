"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

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
        <div className="relative w-full aspect-video bg-stone-200 dark:bg-zinc-700/80 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${organization} project screenshot`}
            className="absolute object-cover group-hover:opacity-80 transition-opacity"
            style={{
              left: '12.5%',
              top: '12.5%',
              width: '88%',
              height: '88%',
              objectPosition: 'left top',
            }}
          />
        </div>
        <div className="mt-4 font-sans not-italic">
          <div className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic" style={{ fontFamily: 'Inter' }}>
            {organization} · <span>{dates}</span>
          </div>
          <p className="mt-0.5 not-italic">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

