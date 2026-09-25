import { cn } from '@/lib/utils';

export default function SectionMarker({
  index,
  title,
  kicker,
  className,
}: {
  index?: string;
  title: string;
  kicker?: string;
  className?: string;
}) {
  return (
    <header className={cn('aoa-section-marker', className)}>
      {kicker ? <p className="aoa-meta">{kicker}</p> : null}
      <div className="flex min-w-0 items-baseline gap-3">
        {index ? <span className="aoa-meta shrink-0 text-[var(--signal)]">{index}</span> : null}
        <h2 className="type-chapter min-w-0 break-words">{title}</h2>
      </div>
    </header>
  );
}
