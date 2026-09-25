import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Trimmed wordmark. The source file is the mark itself, so the frame must not zoom it. */
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
        src="/logo-mark.png"
        alt=""
        fill
        priority={priority}
        sizes="120px"
        className="object-contain object-center"
      />
    </span>
  );
}
