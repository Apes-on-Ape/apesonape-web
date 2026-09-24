import { cn } from '@/lib/utils';

export default function SignalTicker({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  const loop = [...clean, ...clean];

  return (
    <div className={cn('aoa-ticker', className)}>
      <div className="aoa-ticker-track">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="aoa-ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
