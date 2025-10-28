import { cn } from '@/lib/utils';
import { HTMLMotionProps, motion } from 'motion/react';

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES;
  blurLayers?: number;
  className?: string;
  blurIntensity?: number;
  gradientColor?: string;
  showGradient?: boolean;
} & HTMLMotionProps<'div'>;

export function ProgressiveBlur({
  direction = 'bottom',
  blurLayers = 8,
  className,
  blurIntensity = 0.25,
  gradientColor = 'rgba(255, 255, 255, 1)',
  showGradient = false,
  ...props
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2);
  const segmentSize = 1 / (blurLayers + 1);

  // Create gradient color with opacity
  const gradientColorWithOpacity = gradientColor.replace(/,\s*[\d.]+\)$/, ', 0)');
  
  return (
    <div className={cn('relative', className)}>
      {Array.from({ length: layers }).map((_, index) => {
        const angle = GRADIENT_ANGLES[direction];
        const gradientStops = [
          index * segmentSize,
          (index + 1) * segmentSize,
          (index + 2) * segmentSize,
          (index + 3) * segmentSize,
        ].map(
          (pos, posIndex) =>
            `rgba(255, 255, 255, ${posIndex === 1 || posIndex === 2 ? 1 : 0}) ${pos * 100}%`
        );

        const gradient = `linear-gradient(${angle}deg, ${gradientStops.join(
          ', '
        )})`;

        return (
          <motion.div
            key={index}
            className='pointer-events-none absolute inset-0 rounded-[inherit]'
            style={{
              maskImage: gradient,
              WebkitMaskImage: gradient,
              backdropFilter: `blur(${index * blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${index * blurIntensity}px)`,
            }}
            {...props}
          />
        );
      })}
      
      {/* Gradient overlay */}
      {showGradient && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: direction === 'left' 
              ? `linear-gradient(to right, ${gradientColor} 0%, ${gradientColorWithOpacity} 100%)`
              : direction === 'right'
              ? `linear-gradient(to left, ${gradientColor} 0%, ${gradientColorWithOpacity} 100%)`
              : `linear-gradient(${GRADIENT_ANGLES[direction]}deg, ${gradientColor} 0%, ${gradientColorWithOpacity} 100%)`,
          }}
        />
      )}
    </div>
  );
}
