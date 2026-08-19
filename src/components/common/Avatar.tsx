'use client';

import { useState } from 'react';

type AvatarProps = {
  src?: string | null;
  alt?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeClasses: Record<NonNullable<AvatarProps['size']>, { container: string; text: string }> = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm font-bold' },
  lg: { container: 'h-12 w-12', text: 'text-base font-bold' },
  xl: { container: 'h-20 w-20', text: 'text-2xl font-bold' },
};

export default function Avatar({
  src,
  alt = 'アバター',
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initialLetter = (name || '?').slice(0, 1).toUpperCase();
  const config = sizeClasses[size];

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={`${config.container} rounded-full object-cover flex-shrink-0 bg-gray-100 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${config.container} flex flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 ${config.text} ${className}`}
    >
      {initialLetter}
    </div>
  );
}
