import type { ReactNode } from 'react';
import Link from 'next/link';
import { profileHref } from '@/lib/profile/identity';

export default function ApeIdentityLink({
	username,
	className,
	children,
	fallbackHref,
}: {
	username?: string | null;
	className?: string;
	children: ReactNode;
	fallbackHref?: string | null;
}) {
	const href = profileHref(username) || fallbackHref || null;
	if (!href) return <span className={className}>{children}</span>;
	return <Link href={href} className={className}>{children}</Link>;
}
