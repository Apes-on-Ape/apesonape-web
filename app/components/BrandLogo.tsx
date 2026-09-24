import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Wordmark sits in a wide black field. The frame crops into the mark.
 */
export default function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn('relative block overflow-hidden bg-black', className)}>
      <Image
        src="/logo.png"
        alt=""
        fill
        priority={priority}
        sizes="120px"
        className="object-cover object-center scale-[2.35]"
      />
    </span>
  );
}
