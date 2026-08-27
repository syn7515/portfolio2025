import React from 'react';
import { cn } from '@/lib/utils';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface HeadingProps {
  title: string;
  year?: string;
  tocLabel?: string;
  className?: string;
}

export function Heading({ title, year, tocLabel, className }: HeadingProps) {
  const id = slugify(title);
  const titleClassName = 'text-[20px] sm:text-[19px] [text-wrap:wrap] text-stone-800 dark:text-zinc-200';
  const titleStyle = {
    fontFamily: 'var(--font-crimson-pro), serif',
    fontWeight: 450,
    lineHeight: '160%',
    letterSpacing: '-0.02em',
    fontStyle: 'normal',
  } as const;
  const yearClassName = 'text-[15px] !font-[400] sm:!font-[460] leading-[150%] sm:leading-[160%] font-sans text-stone-400 dark:text-zinc-500 whitespace-nowrap';

  return (
    <div
      id={id}
      data-blog-heading
      data-toc-label={tocLabel ?? title}
      className={cn('mt-13 mb-6 sm:mb-8', className)}
    >
      {year && (
        <>
          {/* Mobile: keep title and year together when they fit; otherwise wrap the year intact. */}
          <div className="flex sm:hidden flex-wrap items-baseline gap-x-3 gap-y-0">
            <span className={cn(titleClassName, 'w-max max-w-full shrink-0')} style={titleStyle}>{title}</span>
            <span className={yearClassName} style={{ fontStyle: 'normal' }}>{year}</span>
          </div>

          {/* Desktop: title, dotted divider, and year stay on one line. */}
          <div className="hidden sm:flex items-center gap-3">
            <span className={titleClassName} style={{ ...titleStyle, whiteSpace: 'nowrap' }}>{title}</span>
            <div className="flex-1 mx-0 my-0">
              <div
                className="dotted-divider w-full !text-stone-300 dark:!text-zinc-700"
              />
            </div>
            <span className={yearClassName} style={{ fontStyle: 'normal' }}>{year}</span>
          </div>
        </>
      )}

      {!year && <span className={titleClassName} style={titleStyle}>{title}</span>}
    </div>
  );
}

// Default export for easier MDX usage
export default Heading;
