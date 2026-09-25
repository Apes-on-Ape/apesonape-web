'use client';

import { useEffect, useState } from 'react';
import SafeImage from '@/app/components/SafeImage';

export default function ApeMark({ username, size = 28 }: { username?: string | null; size?: number }) {
	const handle = (username || '').replace(/^@/, '').trim();
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		if (!/^[A-Za-z0-9_]{1,20}$/.test(handle)) return;
		let cancelled = false;
		fetch(`/api/profile/avatars?usernames=${encodeURIComponent(handle)}`, { cache: 'force-cache' })
			.then((response) => response.json())
			.then((json: { avatars?: Record<string, string | null> }) => {
				if (!cancelled) setSrc(json.avatars?.[handle.toLowerCase()] ?? null);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [handle]);

	if (!src) return null;
	return (
		<SafeImage
			src={src}
			alt=""
			width={size}
			height={size}
			className="object-cover"
		/>
	);
}
