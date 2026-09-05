import React from 'react';
import { cn } from '@/utils/cn';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  size = 'lg',
}) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10', sizes[size], className)}>
      {children}
    </div>
  );
};
