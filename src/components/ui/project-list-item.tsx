"use client";

import type { CSSProperties, MouseEvent } from 'react';
import Link from 'next/link';
import { markPaperHomeForwardNav } from '@/lib/paper-exit-transition';
import ExternalArrow from '@/components/ui/external-arrow';

interface ProjectListItemProps {
  title: string;
  // The right-hand column carries whatever context the row needs, not strictly a date: case studies
  // use their year range, personal work names its category ("Personal, 2026"). On phones this column
  // renders above the title, so a category reads there as an eyebrow.
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

const titleClassName = "text-[18px] sm:text-[19px] [text-wrap:wrap] sm:[text-wrap:balance] !text-stone-700 dark:!text-zinc-200 transition-colors duration-150 group-hover:!text-rose-700 group-active:!text-rose-700 group-focus-visible:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400 dark:group-focus-visible:!text-rose-400";
const dividerClassName = "dotted-divider w-full !text-stone-300 dark:!text-zinc-700 transition-[color,opacity] duration-150 group-hover:opacity-40 group-active:opacity-40 group-focus-visible:opacity-40 group-hover:!text-rose-700 group-active:!text-rose-700 group-focus-visible:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400 dark:group-focus-visible:!text-rose-400";
const datesClassName = "text-[14px] sm:text-[15px] !font-[400] sm:!font-[460] leading-[150%] sm:leading-[160%] font-sans !text-stone-400 dark:!text-zinc-500 whitespace-nowrap transition-[color,opacity] duration-150 group-hover:opacity-100 group-active:opacity-100 group-focus-visible:opacity-100 group-hover:!text-rose-700 group-active:!text-rose-700 group-focus-visible:!text-rose-700 dark:group-hover:!text-rose-400 dark:group-active:!text-rose-400 dark:group-focus-visible:!text-rose-400";
// Only the row-specific part: the hover nudge. Size, colour and the rose hover come from the mark
// itself now. Tailwind v4 animates `translate` as its own property, not through `transform` —
// matching the inline `transition: scale ...` the social links use.
const externalIconClassName = "transition-[color,translate] motion-safe:group-hover:translate-x-px motion-safe:group-hover:-translate-y-px";

const linkClassName = "group block w-full cursor-pointer rounded py-2";
const linkStyle: CSSProperties = { textDecoration: 'none' };

export default function ProjectListItem({
  title,
  dates,
  href,
  className,
  style,
}: ProjectListItemProps) {
  // Off-site rows (personal projects) skip the paper transition entirely. markPaperHomeForwardNav
  // hands the *destination* a pre-paint origin signal that the destination is then responsible for
  // clearing — a destination on another origin never will, leaving the flag in sessionStorage for
  // layout.tsx to promote back onto <html> on the next full load of this site.
  const isExternal = /^https?:\/\//i.test(href);

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks open another browsing context; don't leave the current Home document carrying
    // an origin signal for a navigation that did not occur there.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    markPaperHomeForwardNav();
  };

  const icon = isExternal ? <ExternalArrow className={externalIconClassName} /> : null;

  const content = (
    <>
      {/* Mobile: dates lead into the title on separate lines, with no divider. */}
      <div className="flex sm:hidden flex-col gap-0 not-italic">
        <span className={datesClassName}>{dates}</span>
        <span className={titleClassName} style={titleStyle}>{title}{icon}</span>
      </div>

      {/* Desktop: title, dotted divider, and dates on a single row */}
      <div className="hidden sm:flex items-center gap-3 not-italic">
        <span className={titleClassName} style={{ ...titleStyle, whiteSpace: 'nowrap' }}>{title}{icon}</span>
        <div className="flex-1">
          <div className={dividerClassName} />
        </div>
        <span className={datesClassName}>{dates}</span>
      </div>

      {/* Only one of the two blocks above is ever displayed, so this announces once. */}
      {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );

  return (
    <div
      className={`w-full${className ? ` ${className}` : ''}`}
      style={style}
    >
      {isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          style={linkStyle}
        >
          {content}
        </a>
      ) : (
        <Link
          href={href}
          onClick={handleNavigation}
          className={linkClassName}
          style={linkStyle}
        >
          {content}
        </Link>
      )}
    </div>
  );
}
