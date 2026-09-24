import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function BroadcastLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn('aoa-broadcast-label', className)}>{children}</span>;
}
