import { cn } from '@/lib/utils';

/**
 * Red is reserved for a genuine live transmission.
 * Pass `live` only when the app has a real live-stream flag.
 * Playback uses `label` (ON AIR, PLAYING) without the live color.
 */
export default function LiveIndicator({
  live = false,
  label,
  className,
}: {
  live?: boolean;
  label?: string;
  className?: string;
}) {
  if (!live && !label) return null;
  const text = live ? 'LIVE' : label;
  return (
    <span className={cn(live ? 'aoa-live' : 'aoa-onair', className)} role="status">
      <span className={live ? 'aoa-live-dot' : 'aoa-onair-dot'} aria-hidden="true" />
      {text}
    </span>
  );
}
