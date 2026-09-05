import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RatingProps {
  value: number | string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count,
  size = 'md',
  showCount = true,
  className,
}) => {
  const numValue = Number(value) || 0;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center text-amber-400">
        <Star className={cn('fill-current', starSizes[size])} />
      </div>
      <span className={cn('font-semibold text-slate-800', textSizes[size])}>
        {numValue > 0 ? numValue.toFixed(1) : 'Nuevo'}
      </span>
      {showCount && count !== undefined && count > 0 && (
        <span className="text-xs text-slate-500 font-normal">
          ({count})
        </span>
      )}
    </div>
  );
};
