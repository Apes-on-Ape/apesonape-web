'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  variant?: 'default' | 'premium' | 'glass';
  hover?: boolean;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  hover = true,
  children,
  className,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'card',
    premium: 'card-premium',
    glass: 'glass',
  };
  
  const classes = cn(
    variantClasses[variant],
    hover && 'hover:shadow-lg hover:-translate-y-1',
    className
  );
  
  return (
    <motion.div
      className={classes}
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

