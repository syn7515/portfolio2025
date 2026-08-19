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
  const titleClassName = 'text-[21px] sm:text-[19px] text-stone-800 dark:text-zinc-200';
  const titleStyle = {
    fontFamily: 'var(--font-crimson-pro), serif',
    fontWeight: 450,
    lineHeight: '160%',
    letterSpacing: '-0.02em',
    fontStyle: 'normal',
  } as const;
  const yearClassName = 'text-[16px] sm:text-[15px] !font-[460] leading-[160%] font-sans text-stone-400 dark:text-zinc-500';

  return (
    <div
      id={id}
      data-blog-heading
      data-toc-label={tocLabel ?? title}
      className={cn('mt-13 mb-8', className)}
    >
      {year && (
        <>
          {/* Mobile: title and year use separate lines, with no divider. */}
          <div className="flex sm:hidden flex-col items-start gap-0.5">
            <span className={titleClassName} style={titleStyle}>{title}</span>
            <span className={yearClassName} style={{ fontStyle: 'normal' }}>{year}</span>
          </div>

          {/* Desktop: title, dotted divider, and year stay on one line. */}
          <div className="hidden sm:flex items-center gap-3">
            <span className={titleClassName} style={{ ...titleStyle, whiteSpace: 'nowrap' }}>{title}</span>
            <div className="flex-1 mx-0 my-0">
              <div
                className="w-full h-[2px] !text-stone-300 dark:!text-zinc-700"
                style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                  backgroundSize: '5px 2px',
                  backgroundRepeat: 'repeat-x',
                }}
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
