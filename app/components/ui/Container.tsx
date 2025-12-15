'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

export function Container({
  size = 'lg',
  children,
  className,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[90rem]',
    full: 'max-w-full',
  };
  
  const classes = cn(
    'mx-auto px-4 sm:px-6 lg:px-8',
    sizeClasses[size],
    className
  );
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

