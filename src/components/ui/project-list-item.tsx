"use client";

import type { ReactNode, CSSProperties } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ProjectListItemProps {
  title: string;
  dates: string;
  href: string;
  initial?: { opacity: number; y: number; filter?: string } | false;
  animate?: { opacity: number; y: number; filter?: string };
  transition?: { duration: number; ease: [number, number, number, number]; delay?: number };
}

// Prevent widows by keeping the last two words together on their own line
function preventWidow(text: string): ReactNode {
  const words = text.split(' ');
  if (words.length <= 2) return text;

  const lastTwoWords = words.slice(-2).join(' ');
  const restOfText = words.slice(0, -2).join(' ');

  return (
    <>
      {restOfText && `${restOfText} `}
      <span style={{ whiteSpace: 'nowrap' }}>{lastTwoWords}</span>
    </>
  );
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-crimson-pro), serif',
  fontSize: '19px',
  fontWeight: 450,
  lineHeight: '130%',
  letterSpacing: '-0.02em',
  textWrap: 'balance',
};

const dividerStyle: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
  backgroundSize: '5px 2px',
  backgroundRepeat: 'repeat-x',
};

const titleClassName = "!text-stone-700 dark:!text-zinc-200 transition-colors duration-150 group-hover:!text-orange-700 dark:group-hover:!text-lime-200";
const dividerClassName = "w-full h-[2px] !text-stone-300 dark:!text-zinc-700 transition-[color,opacity] duration-150 group-hover:opacity-40 group-hover:!text-orange-700 dark:group-hover:!text-lime-200";
const datesClassName = "text-[15px] !font-[460] leading-[160%] font-sans !text-stone-400 dark:!text-zinc-500 whitespace-nowrap transition-colors duration-150 group-hover:!text-orange-700 dark:group-hover:!text-lime-200";

export default function ProjectListItem({
  title,
  dates,
  href,
  initial,
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] },
}: ProjectListItemProps) {
  return (
    <motion.div
      data-project-list-item
      className="w-full transition-opacity duration-150"
      initial={initial}
      animate={animate}
      transition={transition}
    >
      <Link
        href={href}
        className="group block w-full cursor-pointer py-2"
        style={{ textDecoration: 'none' }}
      >
        {/* Mobile: title wraps on its own line, dates as a small line below (no divider — it has nothing to lead into on its own row) */}
        <div className="flex sm:hidden flex-col gap-1.5 not-italic">
          <span className={titleClassName} style={titleStyle}>{preventWidow(title)}</span>
          <span className={datesClassName}>{dates}</span>
        </div>

        {/* Desktop: title, dotted divider, and dates on a single row */}
        <div className="hidden sm:flex items-center gap-3 not-italic">
          <span className={titleClassName} style={{ ...titleStyle, whiteSpace: 'nowrap' }}>{title}</span>
          <div className="flex-1">
            <div className={dividerClassName} style={dividerStyle} />
          </div>
          <span className={datesClassName}>{dates}</span>
        </div>
      </Link>
    </motion.div>
  );
}
