import React from 'react';
import { Divider } from './divider';
import { cn } from '@/lib/utils';

interface HeadingProps {
  title: string;
  year?: string;
  className?: string;
}

export function Heading({ title, year, className }: HeadingProps) {
  return (
    <div className={cn('flex items-center gap-3 mt-13 mb-8', className)}>
      {/* Title text */}
      <span 
        className="text-[15px] font-[520] leading-[150%] tracking-[0.12px] font-sans text-stone-800 dark:text-zinc-200"
        style={{ fontStyle: 'normal' }}
      >
        {title}
      </span>
      
      {/* Horizontal divider - always shown */}
      <Divider 
        orientation="horizontal" 
        color="stone" 
        variant="default"
        className="flex-1 h-px mx-0 my-0"
      />
      
      {/* Year indication text - only show if provided */}
      {year && (
        <span 
          className="text-[15px] !font-[450] leading-[150%] tracking-[0.12px] font-sans text-stone-500 dark:text-zinc-400"
          style={{ fontStyle: 'normal' }}
        >
          {year}
        </span>
      )}
    </div>
  );
}

// Default export for easier MDX usage
export default Heading;
