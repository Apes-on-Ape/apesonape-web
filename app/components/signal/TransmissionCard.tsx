import Link from 'next/link';
import { cn } from '@/lib/utils';
import BroadcastLabel from './BroadcastLabel';

export default function TransmissionCard({
  kicker,
  title,
  body,
  meta,
  href,
  className,
}: {
  kicker?: string;
  title: string;
  body?: string;
  meta?: string;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        {kicker ? <BroadcastLabel>{kicker}</BroadcastLabel> : <span />}
        {meta ? <span className="aoa-meta">{meta}</span> : null}
      </div>
      <h3 className="type-section mt-3">{title}</h3>
      {body ? <p className="type-body mt-2 text-[var(--ink-dim)]">{body}</p> : null}
    </>
  );

  const classes = cn('aoa-transmission-card', className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return <article className={classes}>{inner}</article>;
}
