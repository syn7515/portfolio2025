"use client";

import type { CSSProperties, MouseEvent } from 'react';
import Link from 'next/link';
import { markPaperHomeForwardNav } from '@/lib/paper-exit-transition';

interface ProjectListItemProps {
  title: string;
  dates: string;
  href: string;
  // The home page's entrance is CSS-driven so it can run before hydration; these carry that
  // animation's class and its per-item delay rather than a Framer transition.
  className?: string;
  style?: CSSProperties;
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-crimson-pro), serif',
  fontWeight: 450,
  lineHeight: '130%',
  letterSpacing: '-0.02em',
};

const titleClassName = "text-[19px] [text-wrap:wrap] sm:[text-wrap:balance] !text-stone-700 dark:!text-zinc-200 transition-colors duration-150 group-hover:!text-orange-700 group-active:!text-orange-700 group-focus-visible:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400 dark:group-focus-visible:!text-orange-400";
const dividerClassName = "dotted-divider w-full !text-stone-300 dark:!text-zinc-700 transition-[color,opacity] duration-150 group-hover:opacity-40 group-active:opacity-40 group-focus-visible:opacity-40 group-hover:!text-orange-700 group-active:!text-orange-700 group-focus-visible:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400 dark:group-focus-visible:!text-orange-400";
const datesClassName = "text-[15px] !font-[400] sm:!font-[460] leading-[150%] sm:leading-[160%] font-sans !text-stone-400 dark:!text-zinc-500 whitespace-nowrap transition-[color,opacity] duration-150 group-hover:opacity-100 group-active:opacity-100 group-focus-visible:opacity-100 group-hover:!text-orange-700 group-active:!text-orange-700 group-focus-visible:!text-orange-700 dark:group-hover:!text-orange-400 dark:group-active:!text-orange-400 dark:group-focus-visible:!text-orange-400";

export default function ProjectListItem({
  title,
  dates,
  href,
  className,
  style,
}: ProjectListItemProps) {
  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks open another browsing context; don't leave the current Home document carrying
    // an origin signal for a navigation that did not occur there.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    markPaperHomeForwardNav();
  };

  return (
    <div
      className={`w-full${className ? ` ${className}` : ''}`}
      style={style}
    >
      <Link
        href={href}
        onClick={handleNavigation}
        className="group block w-full cursor-pointer rounded py-2"
        style={{ textDecoration: 'none' }}
      >
        {/* Mobile: dates lead into the title on separate lines, with no divider. */}
        <div className="flex sm:hidden flex-col gap-0 not-italic">
          <span className={datesClassName}>{dates}</span>
          <span className={titleClassName} style={titleStyle}>{title}</span>
        </div>

        {/* Desktop: title, dotted divider, and dates on a single row */}
        <div className="hidden sm:flex items-center gap-3 not-italic">
          <span className={titleClassName} style={{ ...titleStyle, whiteSpace: 'nowrap' }}>{title}</span>
          <div className="flex-1">
            <div className={dividerClassName} />
          </div>
          <span className={datesClassName}>{dates}</span>
        </div>
      </Link>
    </div>
  );
}
