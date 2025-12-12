import Link from 'next/link';
import { notFound } from 'next/navigation';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import SafeImage from '@/app/components/SafeImage';
import { CreationRecord, CreationType } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

export const dynamic = 'force-dynamic';

const typeLabels: Record<CreationType, string> = {
	sound: 'Sound',
	visual: 'Visual',
	interactive: 'Interactive',
	code: 'Code',
};

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function fetchCreations(slug: string): Promise<CreationRecord[]> {
	const qs = new URLSearchParams({ creator: slug, limit: '100' });
	const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : ''}/api/studio/creations?${qs.toString()}`, {
		cache: 'no-store',
	});
	if (!res.ok) return [];
	const json = await res.json().catch(() => ({ items: [] }));
	return (json.items || []) as CreationRecord[];
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const creations = await fetchCreations(slug);
	if (!creations || creations.length === 0) return notFound();

	const creator = creations[0];
	const displayHandle = creator.glyphProfile?.xHandle || '';
	const displayAddr = creator.creatorAddress || '';

	return (
		<div className="min-h-screen flex flex-col">
			<Nav />
			<main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
				<div className="glass-dark border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl shadow-black/40">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div>
							<div className="text-sm text-off-white/70">Creator</div>
							<h1 className="text-3xl font-bold">
								{displayHandle ? `@${displayHandle}` : shortAddress(displayAddr)}
							</h1>
							<div className="text-off-white/60 text-sm mt-1">
								{creations.length} experiment{creations.length === 1 ? '' : 's'}
							</div>
						</div>
						<div className="flex gap-2">
							<Link href="/studio" className="btn-secondary px-4 py-2 text-sm">
								← Back to Studio
							</Link>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{creations.map((creation) => {
						const artifact = toGatewayUri(creation.artifactUrl);
						return (
							<Link
								key={creation.id}
								href={`/studio/${creation.id}`}
								className="group rounded-xl border border-white/10 bg-black/40 hover:border-hero-blue/40 transition-colors overflow-hidden flex flex-col"
							>
								<div className="relative aspect-[4/3] w-full overflow-hidden bg-black/30">
									{creation.type === 'visual' && (
										<SafeImage src={artifact} alt={creation.title} className="w-full h-full object-cover" fill />
									)}
									{creation.type === 'sound' && (
										<div className="flex flex-col items-center justify-center h-full w-full gap-2 text-off-white/80 p-4">
											<div className="text-sm">Sound</div>
											<audio controls className="w-full">
												<source src={artifact} />
											</audio>
										</div>
									)}
									{creation.type === 'interactive' && (
										<div className="flex flex-col items-center justify-center h-full w-full gap-2 text-off-white/80">
											<div className="text-sm">Interactive</div>
										</div>
									)}
									{creation.type === 'code' && (
										<pre className="text-xs font-mono p-3 text-left whitespace-pre-wrap text-off-white/80">
											{creation.codePreview || creation.description || '// Code snippet'}
										</pre>
									)}
									<div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-black/60 border border-white/10">
										<span>{typeLabels[creation.type]}</span>
									</div>
								</div>
								<div className="p-4 space-y-2">
									<h3 className="font-semibold text-lg line-clamp-1">{creation.title}</h3>
									<p className="text-sm text-off-white/70 line-clamp-2">{creation.description}</p>
									<div className="text-xs text-off-white/60">
										{new Date(creation.createdAt).toLocaleString()}
									</div>
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

