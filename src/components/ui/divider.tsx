import React from 'react';
import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
  variant?: 'default' | 'thick' | 'dashed' | 'dotted' | 'gradient';
  color?: 'gray' | 'stone' | 'slate' | 'zinc';
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | '3xl';
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({
  className,
  variant = 'default',
  color = 'stone',
  spacing = 'md',
  orientation = 'horizontal',
  ...props
}: DividerProps) {
  const baseClasses = 'border-0';
  
  const variantClasses = {
    default: 'border-t',
    thick: 'border-t-2',
    dashed: 'border-t border-dashed',
    dotted: 'border-t border-dotted',
    gradient: 'border-0 h-px bg-gradient-to-r from-stone-300/30 via-stone-300/70 to-stone-300/30',
  };
  
  const colorClasses = {
    gray: variant === 'default' 
      ? 'border-gray-300/50 dark:border-zinc-700/50'
      : 'border-gray-300 dark:border-zinc-700',
    stone: variant === 'default'
      ? 'border-stone-300/50 dark:border-zinc-700/50'
      : 'border-stone-300 dark:border-zinc-700',
    slate: variant === 'default'
      ? 'border-slate-300/50 dark:border-zinc-700/50'
      : 'border-slate-300 dark:border-zinc-700',
    zinc: variant === 'default'
      ? 'border-zinc-300/50 dark:border-zinc-700/50'
      : 'border-zinc-300 dark:border-zinc-700',
  };
  
  const spacingClasses = {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
    xl: 'my-8',
    '3xl': 'my-15', // 3.75rem = 60px
  };
  
  const orientationClasses = {
    horizontal: 'w-full',
    vertical: 'h-full border-l border-t-0',
  };
  
  // For gradient variant, we need special handling
  if (variant === 'gradient') {
    const gradientColorClasses = {
      gray: orientation === 'vertical' 
        ? 'bg-gradient-to-b from-gray-300/30 via-gray-300/70 to-gray-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30'
        : 'bg-gradient-to-r from-gray-300/30 via-gray-300/70 to-gray-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30',
      stone: orientation === 'vertical' 
        ? 'bg-gradient-to-b from-stone-300/30 via-stone-300/70 to-stone-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30'
        : 'bg-gradient-to-r from-stone-300/30 via-stone-300/70 to-stone-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30',
      slate: orientation === 'vertical' 
        ? 'bg-gradient-to-b from-slate-300/30 via-slate-300/70 to-slate-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30'
        : 'bg-gradient-to-r from-slate-300/30 via-slate-300/70 to-slate-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30',
      zinc: orientation === 'vertical' 
        ? 'bg-gradient-to-b from-zinc-300/30 via-zinc-300/70 to-zinc-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30'
        : 'bg-gradient-to-r from-zinc-300/30 via-zinc-300/70 to-zinc-300/30 dark:from-zinc-700/30 dark:via-zinc-700/70 dark:to-zinc-700/30',
    };
    
    const gradientSizeClasses = orientation === 'vertical' 
      ? 'w-px h-full'
      : 'w-full h-px';
    
    return (
      <div
        className={cn(
          baseClasses,
          gradientSizeClasses,
          gradientColorClasses[color],
          spacingClasses[spacing],
          orientationClasses[orientation],
          className
        )}
        {...props}
      />
    );
  }
  
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          colorClasses[color],
          orientationClasses[orientation],
          className
        )}
        {...props}
      />
    );
  }
  
  return (
    <hr
      className={cn(
        baseClasses,
        variantClasses[variant],
        colorClasses[color],
        spacingClasses[spacing],
        orientationClasses[orientation],
        className
      )}
      {...props}
    />
  );
}

// Default export for easier MDX usage
export default Divider;
