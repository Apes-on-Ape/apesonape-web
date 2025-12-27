'use client';

import React from 'react';

export default function WardrobeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// No authentication wrapper - wardrobe is open to everyone
	return <>{children}</>;
}

