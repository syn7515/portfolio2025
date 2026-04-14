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
  return (
    <div
      id={id}
      data-blog-heading
      data-toc-label={tocLabel ?? title}
      className={cn('flex items-center gap-3 mt-13 mb-8', className)}
    >
      {/* Title text */}
      <span
        className="text-[15px] font-[520] leading-[160%] font-sans text-stone-800 dark:text-zinc-200"
        style={{ fontStyle: 'normal' }}
      >
        {title}
      </span>

      {/* Dotted divider and year - only show if year is provided */}
      {year && (
        <>
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
          <span
            className="text-[15px] !font-[420] leading-[160%] font-sans text-stone-400 dark:text-zinc-500"
            style={{ fontStyle: 'normal' }}
          >
            {year}
          </span>
        </>
      )}
    </div>
  );
}

// Default export for easier MDX usage
export default Heading;
