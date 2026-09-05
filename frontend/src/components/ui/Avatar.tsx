import React from 'react';
import { cn } from '@/utils/cn';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Usuario',
  name,
  size = 'md',
  className,
}) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => setHasError(false), [src]);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={cn(
          'rounded-full object-cover border border-slate-200 shadow-sm shrink-0',
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium border border-brand-200 shrink-0 shadow-sm',
        sizes[size],
        className,
      )}
    >
      {getInitials(name || alt)}
    </div>
  );
};
