'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'elevated' | 'surface';
}

export function Section({
  children,
  spacing = 'lg',
  background = 'default',
  className,
  ...props
}: SectionProps) {
  const spacingClasses = {
    none: '',
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
    xl: 'py-24 md:py-32',
  };
  
  const backgroundClasses = {
    default: '',
    elevated: 'bg-background-elevated',
    surface: 'bg-background-surface',
  };
  
  const classes = cn(
    'relative',
    spacingClasses[spacing],
    backgroundClasses[background],
    className
  );
  
  return (
    <motion.section
      className={classes}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

