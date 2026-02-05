'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, ExternalLink, ShieldAlert, Trash2 } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { CreationRecord } from '@/lib/studio/types';
import { gatewayCandidates } from '@/lib/studio/urls';
import { useGlyph } from '@use-glyph/sdk-react';
import { usePrivy } from '@privy-io/react-auth';

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type Props = {
	creation: CreationRecord;
};

export default function CreationDetailClient({ creation }: Props) {
	const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [remixImage, setRemixImage] = useState<File | null>(null);
	const [remixPreview, setRemixPreview] = useState<string | null>(null);
	const [remixApeId, setRemixApeId] = useState('');
	const [remixTitle, setRemixTitle] = useState('');
	const [matchOriginal, setMatchOriginal] = useState(true);
	const [characterDescription, setCharacterDescription] = useState('');
	const [remixBusy, setRemixBusy] = useState(false);
	const [remixError, setRemixError] = useState<string | null>(null);
	const [remixStatus, setRemixStatus] = useState<string | null>(null);
	const [remixes, setRemixes] = useState<CreationRecord[]>([]);
	const glyph = (useGlyph() as unknown) as {
		user?: {
			id?: string;
			evmWallet?: string;
			smartWallet?: string;
			hasTwitter?: boolean;
			hasProfile?: boolean;
			linkedWallets?: Array<{ address?: string; walletClientType?: string }>;
		};
		authenticated?: boolean;
		login?: () => Promise<void>;
	};
	const privy = (usePrivy() as unknown) as { user?: { twitter?: { username?: string } } | null };
	const router = useRouter();

	const metadataGateways = useMemo(
		() => gatewayCandidates(creation.metadataUrl),
		[creation.metadataUrl],
	);
	const metadataUri = metadataGateways[0];
	const walletAddr = useMemo(
		() => (glyph?.user?.evmWallet || glyph?.user?.smartWallet || '').toLowerCase(),
		[glyph?.user?.evmWallet, glyph?.user?.smartWallet],
	);
	const isOwner =
		!!walletAddr && walletAddr === (creation.creatorAddress || '').toLowerCase();

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				let text: string | null = null;
				for (const url of metadataGateways) {
					try {
						const proxyUrl = `/api/studio/ipfs?url=${encodeURIComponent(url)}`;
						const res = await fetch(proxyUrl, { cache: 'no-store' });
						if (!res.ok) continue;
						text = await res.text();
						break;
					} catch {
						continue;
					}
				}
				if (!text || cancelled) return;
				try {
					setMetadata(JSON.parse(text));
				} catch {
					setMetadata(null);
				}
			} catch {
				// Ignore metadata fetch failures; core view works without it.
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [metadataGateways]);

	const artifactGateways = useMemo(
		() => gatewayCandidates(creation.artifactUrl),
		[creation.artifactUrl],
	);
	const artifactUri = artifactGateways[0];
	const metaArtifact = (metadata?.artifact as Record<string, unknown>) || {};
	const prompt = (metaArtifact?.prompt as string | undefined) || creation.artifact.prompt;
	const parentId = (metaArtifact?.generator as { sourceCreationId?: string } | undefined)?.sourceCreationId
		|| (creation.artifact?.generator as { sourceCreationId?: string } | undefined)?.sourceCreationId
		|| '';
	const address = glyph?.user?.evmWallet || glyph?.user?.smartWallet || '';
	const xHandle = privy?.user?.twitter?.username || '';
	const glyphVerified = !!glyph?.user?.hasTwitter || !!glyph?.user?.hasProfile;
	const glyphId = glyph?.user?.id || '';
	const canGenerate = !!(glyph?.user || glyph?.authenticated) && !!address;
	const linkedWallets = glyph?.user?.linkedWallets || [];

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const qs = new URLSearchParams({ type: 'visual', limit: '30' });
				const res = await fetch(`/api/studio/creations?${qs.toString()}`, { cache: 'no-store' });
				const json = await res.json().catch(() => ({}));
				if (!res.ok || !active) return;
				const items = (json.items || []) as CreationRecord[];
				const filtered = items.filter((item) => {
					const sourceId = (item.artifact?.generator as { sourceCreationId?: string } | undefined)?.sourceCreationId;
					return sourceId === creation.id;
				});
				if (active) setRemixes(filtered.slice(0, 12));
			} catch {
				if (active) setRemixes([]);
			}
		})();
		return () => {
			active = false;
		};
	}, [creation.id]);

	const handleDelete = async () => {
		if (!isOwner || deleting) return;
		const confirmed = window.confirm('Delete this creation permanently?');
		if (!confirmed) return;
		try {
			setDeleting(true);
			const res = await fetch(`/api/studio/creations/${creation.id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					creatorAddress: creation.creatorAddress,
					glyphId: creation.glyphProfile?.glyphId,
				}),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json?.error || 'Delete failed');
			}
			router.push('/studio');
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to delete');
		} finally {
			setDeleting(false);
		}
	};

	const onRemixFileChange = (file: File | null) => {
		setRemixImage(file);
		setRemixError(null);
		if (remixPreview) URL.revokeObjectURL(remixPreview);
		if (file) {
			setRemixPreview(URL.createObjectURL(file));
		} else {
			setRemixPreview(null);
		}
	};

	useEffect(() => {
		return () => {
			if (remixPreview) URL.revokeObjectURL(remixPreview);
		};
	}, [remixPreview]);

	const handleRemix = async () => {
		setRemixError(null);
		setRemixStatus(null);
		if (!prompt) {
			setRemixError('Prompt missing for this creation.');
			return;
		}
		if (!canGenerate) {
			setRemixError('Connect your wallet with Glyph to generate.');
			return;
		}
		if (!matchOriginal && !remixImage) {
			setRemixError('Upload an image to remix, or check "Match original pose & colors" to use the original image.');
			return;
		}
		if (!remixApeId.trim()) {
			setRemixError('Ape ID is required.');
			return;
		}
		if (remixImage && !remixImage.type.startsWith('image/')) {
			setRemixError('Only image uploads are supported.');
			return;
		}

		const form = new FormData();
		form.append('creatorAddress', address);
		if (linkedWallets.length > 0) {
			form.append('linkedWallets', JSON.stringify(linkedWallets));
		}
		form.append('apeId', remixApeId.trim());
		form.append('matchOriginal', matchOriginal ? 'true' : 'false');
		if (characterDescription.trim()) {
			form.append('characterDescription', characterDescription.trim());
		}
		if (remixTitle.trim()) {
			form.append('title', remixTitle.trim());
		}
		if (glyphId) form.append('glyphId', glyphId);
		if (xHandle) form.append('xHandle', xHandle);
		form.append('glyphVerified', glyphVerified ? 'true' : 'false');
		if (remixImage) {
			form.append('artifact', remixImage);
		}

		try {
			setRemixBusy(true);
			setRemixStatus('Generating remix...');
			const res = await fetch(`/api/studio/creations/${creation.id}/generate`, {
				method: 'POST',
				body: form,
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json?.error || 'Remix failed');
			const newId = json?.creation?.id as string | undefined;
			if (newId) {
				router.push(`/studio/${newId}`);
			} else {
				setRemixStatus('Remix saved.');
			}
		} catch (err: unknown) {
			setRemixError(err instanceof Error ? err.message : 'Remix failed');
		} finally {
			setRemixBusy(false);
			setRemixStatus(null);
		}
	};

	return (
		<div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
				<div>
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hero-blue/40 text-hero-blue text-sm font-semibold">
						AI IMAGE experiment
					</div>
					{parentId && (
						<div className="mt-2 text-xs text-off-white/70">
							Remix of{' '}
							<Link href={`/studio/${parentId}`} className="underline underline-offset-2">
								original prompt
							</Link>
						</div>
					)}
					<h1 className="text-3xl font-bold mt-2">{creation.title}</h1>
					<p className="text-off-white/70 mt-1">{creation.description}</p>
					<div className="flex items-center gap-3 text-xs text-off-white/60 mt-2 flex-wrap">
						<span>Created {new Date(creation.createdAt).toLocaleString()}</span>
						<span>•</span>
						<span>{shortAddress(creation.creatorAddress)}</span>
						{creation.glyphProfile?.verified ? (
							<span className="inline-flex items-center gap-1 text-green-400">
								<BadgeCheck className="w-4 h-4" /> Verified via Glyph
							</span>
						) : (
							<span className="inline-flex items-center gap-1 text-off-white/60">
								<ShieldAlert className="w-4 h-4" /> Not verified
							</span>
						)}
						{creation.glyphProfile?.xHandle && (
							<Link
								href={`/studio/creator/${creation.glyphProfile.xHandle.toLowerCase()}`}
								className="text-off-white/70 underline-offset-2 hover:underline"
							>
								@{creation.glyphProfile.xHandle}
							</Link>
						)}
						{!creation.glyphProfile?.xHandle && creation.creatorAddress && (
							<Link
								href={`/studio/creator/${creation.creatorAddress.toLowerCase()}`}
								className="text-off-white/70 underline-offset-2 hover:underline"
							>
								{shortAddress(creation.creatorAddress)}
							</Link>
						)}
					</div>
					{creation.tags && creation.tags.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-2">
							{creation.tags.map((tag) => (
								<span key={tag} className="px-2 py-1 text-2xs rounded-full bg-white/5 border border-white/10 text-off-white/70">
									#{tag}
								</span>
							))}
						</div>
					)}
				</div>
				<div className="flex items-center gap-3">
					<Link
						href={artifactUri}
						target="_blank"
						className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2"
					>
						Open artifact <ExternalLink className="w-4 h-4" />
					</Link>
					<Link
						href={metadataUri}
						target="_blank"
						className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2"
					>
						View metadata <ExternalLink className="w-4 h-4" />
					</Link>
					{isOwner && (
						<button
							type="button"
							onClick={handleDelete}
							disabled={deleting}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400/50 text-red-200 bg-red-500/10 text-sm hover:bg-red-500/20 disabled:opacity-60"
						>
							<Trash2 className="w-4 h-4" />
							{deleting ? 'Deleting…' : 'Delete'}
						</button>
					)}
					<Link
						href="/studio"
						className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2"
					>
						← Back to Studio
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden min-h-[320px] relative">
					{creation.type === 'visual' ? (
						<SafeImage src={artifactUri} alt={creation.title} className="w-full h-full object-contain" fill />
					) : (
						<div className="flex items-center justify-center h-full w-full text-off-white/70 text-sm">
							Preview unavailable
						</div>
					)}
				</div>
				<div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4">
					{prompt && (
						<div className="text-sm text-off-white/80">
							<div className="font-semibold mb-1">Prompt</div>
							<p className="text-xs text-off-white/70 whitespace-pre-wrap">{prompt}</p>
						</div>
					)}
					{!parentId && (
						<div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-3">
							<div className="text-sm font-semibold text-off-white/90">Generate a new image from this prompt</div>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={matchOriginal}
									onChange={(e) => setMatchOriginal(e.target.checked)}
									disabled={!canGenerate || remixBusy}
									className="rounded border-white/20 bg-black/40"
								/>
								<span className="text-xs text-off-white/80">Match original pose & colors</span>
							</label>
							<p className="text-xs text-off-white/50">
								{matchOriginal
									? 'Uses the original image as base; only the character will change per your description.'
									: 'Uses your uploaded image as base for the remix.'}
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-black/40 hover:bg-black/30 transition-colors p-4 cursor-pointer">
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => onRemixFileChange(e.target.files?.[0] || null)}
										disabled={!canGenerate || remixBusy}
									/>
									<div className="text-xs text-off-white/70">
										{matchOriginal ? 'Upload optional reference (ignored when matching original)' : 'Upload an image (max 20MB)'}
									</div>
								</label>
								<div className="rounded-lg border border-white/15 bg-black/40 h-32 flex items-center justify-center overflow-hidden">
									{remixPreview ? (
										<img src={remixPreview} alt="Remix preview" className="object-contain w-full h-full" />
									) : (
										<div className="text-xs text-off-white/50">No image selected</div>
									)}
								</div>
							</div>
							{matchOriginal && (
								<div>
									<label className="block text-xs mb-1 text-off-white/70">Character description (who to put in the same pose)</label>
									<input
										value={characterDescription}
										onChange={(e) => setCharacterDescription(e.target.value.slice(0, 280))}
										className="w-full rounded-md bg-black/40 border border-white/10 p-2 text-sm"
										placeholder="e.g. a golden retriever, a robot, my BAYC #123"
										disabled={!canGenerate || remixBusy}
									/>
								</div>
							)}
							<div>
								<label className="block text-xs mb-1 text-off-white/70">Ape ID</label>
								<input
									value={remixApeId}
									onChange={(e) => setRemixApeId(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
									className="w-full rounded-md bg-black/40 border border-white/10 p-2 text-sm"
									placeholder="Your Ape #"
									disabled={!canGenerate || remixBusy}
								/>
								<div className="text-xs text-off-white/50 mt-1">Use the Ape ID shown in collection. Each Ape can be used once.</div>
							</div>
							<div>
								<label className="block text-xs mb-1 text-off-white/70">Remix title (optional)</label>
								<input
									value={remixTitle}
									onChange={(e) => setRemixTitle(e.target.value.slice(0, 80))}
									className="w-full rounded-md bg-black/40 border border-white/10 p-2 text-sm"
									placeholder={`${creation.title} Remix`}
									disabled={!canGenerate || remixBusy}
								/>
							</div>
							<div className="flex items-center gap-2">
								{!canGenerate ? (
									<button
										type="button"
										onClick={() => { void glyph?.login?.(); }}
										className="btn-secondary px-3 py-1.5 text-xs"
									>
										Connect with Glyph
									</button>
								) : (
									<button
										type="button"
										onClick={handleRemix}
										disabled={remixBusy}
										className="btn-primary px-3 py-1.5 text-xs"
									>
										{remixBusy ? 'Generating…' : 'Generate'}
									</button>
								)}
								{remixStatus && <div className="text-xs text-off-white/60">{remixStatus}</div>}
							</div>
							{remixError && <div className="text-xs text-red-300">{remixError}</div>}
						</div>
					)}
					{error && <div className="text-red-300 text-xs mt-1">{error}</div>}
					<div className="text-sm text-off-white/80">
						<div className="font-semibold mb-1">Artifact</div>
						<ul className="space-y-1 text-off-white/70 text-xs">
							<li>URI: {creation.artifactUrl}</li>
							{(() => {
								const mime = metaArtifact?.mime;
								const size = metaArtifact?.size;
								return (
									<>
										{mime != null && <li>MIME: {String(mime)}</li>}
										{size != null && <li>Size: {String(size)} bytes</li>}
									</>
								);
							})()}
						</ul>
					</div>
				</div>
			</div>

			{remixes.length > 0 && (
				<div className="mt-8">
					<div className="text-lg font-semibold mb-3">Remixes</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{remixes.map((item) => {
							const preview = gatewayCandidates(item.artifactUrl)[0];
							return (
								<Link
									key={item.id}
									href={`/studio/${item.id}`}
									className="group rounded-xl border border-white/10 bg-black/40 hover:border-hero-blue/40 transition-colors overflow-hidden flex flex-col"
								>
									<div className="relative aspect-[4/3] w-full overflow-hidden bg-black/30">
										<SafeImage src={preview} alt={item.title} className="w-full h-full object-cover" fill />
									</div>
									<div className="p-3 space-y-1">
										<div className="text-sm font-semibold line-clamp-1">{item.title}</div>
										{item.creatorAddress && (
											<div className="text-xs text-off-white/60">{shortAddress(item.creatorAddress)}</div>
										)}
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

