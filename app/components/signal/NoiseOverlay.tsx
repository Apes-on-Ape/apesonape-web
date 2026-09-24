import { cn } from '@/lib/utils';

/** Decorative grain and scanlines. Does not capture pointer events. */
export default function NoiseOverlay({
  className,
  scanlines = true,
}: {
  className?: string;
  scanlines?: boolean;
}) {
  return (
    <div className={cn('aoa-noise', className)} aria-hidden="true">
      {scanlines ? <div className="aoa-scanlines" /> : null}
    </div>
  );
}
