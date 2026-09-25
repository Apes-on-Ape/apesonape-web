'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const CDN_THUMB_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';
const PAGE_SIZE = 24;

export default function ProfileApeGrid({
	walletAddresses,
	tokenIds,
	heading = 'My Apes',
	showCollectionLink = false,
}: {
	walletAddresses: string[];
	tokenIds?: number[];
	heading?: string;
	showCollectionLink?: boolean;
}) {
	const [allIds, setAllIds] = useState<number[]>(tokenIds ?? []);
	const [loading, setLoading] = useState(true);
	const [fetchError, setFetchError] = useState(false);
	const [page, setPage] = useState(0);
	const addressKey = walletAddresses.join(',');
	const suppliedIds = tokenIds != null;
	const tokenKey = tokenIds?.join(',') ?? '';
	const totalPages = Math.ceil(allIds.length / PAGE_SIZE);
	const pageIds = allIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	const loadPortfolio = useCallback(async () => {
		if (suppliedIds) {
			setAllIds(tokenKey.split(',').map(Number).filter((id) => Number.isInteger(id)));
			setLoading(false);
			return;
		}
		const wallets = addressKey ? addressKey.split(',').filter(Boolean) : [];
		if (!wallets.length) return;
		setLoading(true);
		setFetchError(false);
		try {
			const params = new URLSearchParams();
			wallets.forEach((address) => params.append('addresses', address));
			const response = await fetch(`/api/portfolio?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'Failed');
			setAllIds(data.tokenIds ?? []);
		} catch {
			setFetchError(true);
		} finally {
			setLoading(false);
		}
	}, [addressKey, suppliedIds, tokenKey]);

	useEffect(() => {
		void loadPortfolio();
	}, [loadPortfolio]);

	if (!walletAddresses.length && !suppliedIds) {
		return <p className="mt-8 text-sm text-[var(--ink-mute)]">No wallet on this record yet.</p>;
	}

	if (loading) {
		return (
			<div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
				{Array.from({ length: 8 }).map((_, index) => (
					<div key={index} className="aspect-square animate-pulse bg-white/5" />
				))}
			</div>
		);
	}

	if (fetchError) {
		return (
			<div className="mt-8">
				<p className="text-sm text-[var(--ink-mute)]">Couldn&apos;t load these Apes.</p>
				<button type="button" onClick={() => { void loadPortfolio(); }} className="aoa-meta mt-4 text-[var(--ink)]">
					Try again
				</button>
			</div>
		);
	}

	return (
		<section className="mt-8">
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<h2 className="font-[family-name:var(--font-signal-display)] text-2xl font-bold uppercase tracking-tight">
					{heading}{allIds.length ? ` // ${allIds.length}` : ''}
				</h2>
				{showCollectionLink ? (
					<Link href="/collection" className="aoa-meta text-[var(--ink)] hover:text-[var(--signal)]">See all</Link>
				) : null}
			</div>
			{allIds.length === 0 ? (
				<p className="text-sm text-[var(--ink-mute)]">No Apes returned for these wallets.</p>
			) : (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
					{pageIds.map((tokenId) => (
						<Link
							key={tokenId}
							href={`/collection/${tokenId}`}
							className="group block border border-transparent hover:border-[var(--signal)]"
						>
							<div className="relative aspect-square overflow-hidden bg-black">
								<img
									src={`${CDN_THUMB_BASE}/${tokenId}.webp`}
									alt={`Ape #${tokenId}`}
									loading="lazy"
									className="h-full w-full object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.04]"
								/>
								<div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-2 py-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 motion-reduce:transition-none">
									<span className="font-mono text-[11px] text-[var(--ink)]">#{tokenId}</span>
									<span className="aoa-meta text-[var(--ink)]">View ape</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
			{totalPages > 1 ? (
				<div className="mt-6 flex items-center justify-between">
					<button
						type="button"
						onClick={() => setPage((current) => Math.max(0, current - 1))}
						disabled={page === 0}
						className="aoa-meta text-[var(--ink)] disabled:opacity-30"
					>
						Prev
					</button>
					<p className="font-mono text-sm text-[var(--ink-mute)]">{page + 1} / {totalPages}</p>
					<button
						type="button"
						onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
						disabled={page === totalPages - 1}
						className="aoa-meta text-[var(--ink)] disabled:opacity-30"
					>
						Next
					</button>
				</div>
			) : null}
		</section>
	);
}
