'use client';

import React from 'react';
import HolderOnly from '@/app/components/HolderOnly';

export default function CreativeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<HolderOnly>
			{children}
		</HolderOnly>
	);
}

