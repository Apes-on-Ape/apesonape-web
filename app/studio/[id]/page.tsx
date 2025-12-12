import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import CreationDetailClient from './CreationDetailClient';
import { notFound } from 'next/navigation';
import type { CreationRecord } from '@/lib/studio/types';

async function fetchCreation(id: string): Promise<CreationRecord | null> {
	const base =
		process.env.NEXT_PUBLIC_SITE_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
	try {
		const res = await fetch(`${base}/api/studio/creations/${id}`, { cache: 'no-store' });
		if (!res.ok) return null;
		return (await res.json()) as CreationRecord;
	} catch {
		return null;
	}
}

export default async function StudioDetailPage({ params }: { params: { id: string } }) {
	const creation = await fetchCreation(params.id);
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

