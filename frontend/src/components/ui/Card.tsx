import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card transition-all duration-200',
        hoverEffect && 'hover:shadow-hover hover:-translate-y-0.5 hover:border-slate-300',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
