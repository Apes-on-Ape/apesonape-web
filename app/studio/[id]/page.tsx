import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import CreationDetailClient from './CreationDetailClient';
import { notFound } from 'next/navigation';
import type { CreationRecord } from '@/lib/studio/types';
import { getCreation } from '@/lib/studio/persistence';

export const dynamic = 'force-dynamic';

async function fetchCreationViaApi(id: string): Promise<CreationRecord | null> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : ''}/api/studio/creations/${id}`, {
			cache: 'no-store',
		});
		if (!res.ok) return null;
		return (await res.json()) as CreationRecord;
	} catch {
		return null;
	}
}

export default async function StudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	// Prefer API to work in production and relative in dev; fall back to local persistence (dev)
	const creation = (await fetchCreationViaApi(id)) ?? (await getCreation(id));
	if (!creation) return notFound();

	return (
		<div className="min-h-screen flex flex-col">
			<Nav />
			<main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
				<CreationDetailClient creation={creation} />
			</main>
			<Footer />
		</div>
	);
}

