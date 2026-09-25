import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Footer from '@/app/components/Footer';
import BrandLogo from '@/app/components/BrandLogo';
import SafeImage from '@/app/components/SafeImage';
import { creatorCards } from '@/lib/profile/creator-identity';
import { listCreations } from '@/lib/studio/persistence';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

export const dynamic = 'force-dynamic';

async function fetchCreations(slug: string): Promise<CreationRecord[]> {
	const result = await listCreations({ creator: slug, limit: 50, type: 'visual' });
	return result.items;
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const creations = await fetchCreations(slug);
	if (!creations || creations.length === 0) return notFound();

	const address = (creations[0].creatorAddress || slug).toLowerCase();
	const glyphByAddress = new Map<string, string>();
	const glyphId = creations[0].glyphProfile?.glyphId?.trim();
	if (glyphId) glyphByAddress.set(address, glyphId);
	const card = (await creatorCards([address], glyphByAddress)).get(address);
	if (card?.profileHref) redirect(card.profileHref);

	return (
		<div className="min-h-screen flex flex-col text-[var(--ink)]">
			<main className="container-premium flex-1 pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
				<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div className="flex items-center gap-4">
						<div className="relative h-16 w-16 shrink-0 overflow-hidden border border-white/15 bg-black">
							{card?.avatarUrl ? <SafeImage src={card.avatarUrl} alt="" fill className="object-cover" unoptimized /> : <BrandLogo className="h-full w-full" />}
						</div>
						<div>
							<p className="aoa-meta text-[var(--signal)]">Ape</p>
							<h1 className="type-section mt-2 break-words">{card?.label || address}</h1>
							<p className="aoa-meta mt-2">{creations.length} artifact{creations.length === 1 ? '' : 's'}</p>
						</div>
					</div>
					<Link href="/studio" className="aoa-home-cta aoa-home-cta-ghost">Return to the lab</Link>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{creations.map((creation) => {
						const artifact = toGatewayUri(creation.artifactUrl);
						return (
							<Link
								key={creation.id}
								href={`/studio/${creation.id}`}
								className="flex min-w-0 flex-col overflow-hidden border border-[rgba(243,238,228,0.12)]"
							>
								<div className="relative aspect-[4/3] w-full overflow-hidden bg-black/30">
									{creation.type === 'visual' && (
										<SafeImage src={artifact} alt={creation.title} className="w-full h-full object-cover" fill />
									)}
									{creation.type !== 'visual' && (
										<div className="flex items-center justify-center h-full w-full text-sm text-[var(--ink-dim)]">
											Preview unavailable
										</div>
									)}
								</div>
								<div className="space-y-2 p-3">
									<p className="aoa-meta text-[var(--signal)]">Artifact // {creation.id.slice(0, 8)}</p>
									<h3 className="line-clamp-1 font-semibold">{creation.title}</h3>
									{(creation.artifact?.prompt || creation.description) ? (
										<p className="line-clamp-2 text-sm text-[var(--ink-dim)]">{creation.artifact?.prompt || creation.description}</p>
									) : null}
									<p className="aoa-meta">{new Date(creation.createdAt).toLocaleString()}</p>
								</div>
							</Link>
						);
					})}
				</div>
			</main>
			<Footer />
		</div>
	);
}

