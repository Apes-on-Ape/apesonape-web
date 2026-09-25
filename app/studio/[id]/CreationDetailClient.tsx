'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Link2, ShieldAlert, Trash2 } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import ApeIdentityLink from '@/app/components/profile/ApeIdentityLink';
import ApeMark from '@/app/components/profile/ApeMark';
import { CreationRecord } from '@/lib/studio/types';
import { gatewayCandidates } from '@/lib/studio/urls';
import { usePrivy } from '@privy-io/react-auth';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function studioFilePath(uri: string): string | null {
	if (!uri) return null;
	const path = uri.startsWith('/studio/') ? uri : (() => {
		try {
			const parsed = new URL(uri);
			return parsed.pathname.startsWith('/studio/') ? parsed.pathname : '';
		} catch {
			return '';
		}
	})();
	if (!path || path.includes('..') || !/^\/studio\/[A-Za-z0-9._-]+$/.test(path)) return null;
	return path;
}

type Props = {
	creation: CreationRecord;
};

export default function CreationDetailClient({ creation }: Props) {
	const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const router = useRouter();

	const metadataGateways = useMemo(
		() => gatewayCandidates(creation.metadataUrl),
		[creation.metadataUrl],
	);
	const metadataUri = metadataGateways[0];
	const session = useSessionWallets();
	const { getAccessToken } = (usePrivy() as unknown) as { getAccessToken?: () => Promise<string | null> };
	const walletAddr = session.primaryAddress;
	const creator = (creation.creatorAddress || '').toLowerCase();
	const isOwner = session.addresses.includes(creator) || (!!walletAddr && walletAddr === creator);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				let text: string | null = null;
				for (const url of metadataGateways) {
					try {
						const studioPath = studioFilePath(url);
						const proxyUrl = studioPath || `/api/studio/ipfs?url=${encodeURIComponent(url)}`;
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
	const prompt = creation.artifact?.prompt ?? (metaArtifact?.prompt as string | undefined);
	const parentId = (metaArtifact?.generator as { sourceCreationId?: string } | undefined)?.sourceCreationId
		|| (creation.artifact?.generator as { sourceCreationId?: string } | undefined)?.sourceCreationId
		|| '';
	const handleDelete = async () => {
		if (!isOwner || deleting) return;
		const confirmed = window.confirm('Delete this creation permanently?');
		if (!confirmed) return;
		try {
			setDeleting(true);
			const token = await getAccessToken?.();
			const res = await fetch(`/api/studio/creations/${creation.id}/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({}),
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

	const copyValue = (field: string, value: string) => {
		if (!value || typeof navigator === 'undefined' || !navigator.clipboard) return;
		void navigator.clipboard.writeText(value).then(() => {
			setCopiedField(field);
			window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
		});
	};

	return (
		<div className="text-[var(--ink)]">
			<div className="mb-6 flex flex-col gap-4">
				<div>
					<p className="aoa-meta text-[var(--signal)]">Artifact // {creation.id}</p>
					{parentId && (
						<p className="aoa-meta mt-2">
							Earlier transmission{' '}
							<Link href={`/studio/${parentId}`} className="text-[var(--signal)]">
								{parentId}
							</Link>
						</p>
					)}
					<h1 className="type-section mt-3 break-words">{creation.title}</h1>
					{creation.description ? <p className="mt-2 text-sm text-[var(--ink-dim)]">{creation.description}</p> : null}
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
						<ApeIdentityLink
							username={creation.glyphProfile?.xHandle}
							fallbackHref={creation.creatorAddress ? `/studio/creator/${creation.creatorAddress.toLowerCase()}/` : null}
							className="text-off-white/70 underline-offset-2 hover:underline"
						>
							{creation.glyphProfile?.xHandle ? `@${creation.glyphProfile.xHandle}` : shortAddress(creation.creatorAddress)}
						</ApeIdentityLink>
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
				<div className="flex flex-wrap items-center gap-2">
					<Link href={artifactUri} target="_blank" rel="noreferrer" className="aoa-home-cta aoa-home-cta-ghost">
						Open artifact ↗
					</Link>
					<Link href={metadataUri} target="_blank" rel="noreferrer" className="aoa-home-cta aoa-home-cta-ghost">
						Metadata ↗
					</Link>
					<button
						type="button"
						onClick={() => {
							if (typeof window === 'undefined') return;
							const url = window.location.href;
							if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
								void navigator.clipboard.writeText(url);
							}
						}}
						className="aoa-home-cta aoa-home-cta-ghost"
					>
						<Link2 className="w-4 h-4" />
						Copy link
					</button>
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
					<Link href="/studio" className="aoa-home-cta aoa-home-cta-ghost">
						Return to the lab
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
				<div className="relative min-h-[280px] overflow-hidden border border-[rgba(243,238,228,0.12)] bg-black/40 aspect-square">
					{creation.type === 'visual' ? (
						<SafeImage src={artifactUri} alt={creation.title} className="w-full h-full object-contain" fill />
					) : (
						<div className="flex items-center justify-center h-full w-full text-off-white/70 text-sm">
							Preview unavailable
						</div>
					)}
				</div>
				<div className="min-w-0 space-y-4 border border-[rgba(243,238,228,0.12)] p-4">
					<dl className="space-y-3 text-sm">
						<div>
							<dt className="aoa-meta">Published</dt>
							<dd className="mt-1">{new Date(creation.createdAt).toLocaleString()}</dd>
						</div>
						<div>
							<dt className="aoa-meta">Creator</dt>
							<dd className="mt-1 flex items-center gap-2 break-all">
								<span className="relative h-7 w-7 shrink-0 overflow-hidden bg-black">
									<ApeMark username={creation.glyphProfile?.xHandle} />
								</span>
								<ApeIdentityLink
									username={creation.glyphProfile?.xHandle}
									fallbackHref={creation.creatorAddress ? `/studio/creator/${creation.creatorAddress.toLowerCase()}/` : null}
									className="hover:text-[var(--signal)]"
								>
									{creation.glyphProfile?.xHandle ? `@${creation.glyphProfile.xHandle}` : shortAddress(creation.creatorAddress)}
								</ApeIdentityLink>
							</dd>
						</div>
						{creation.contentHash ? (
							<div>
								<dt className="aoa-meta">Hash</dt>
								<dd className="mt-1 flex flex-wrap items-center gap-2">
									<span className="break-all font-mono text-xs" title={creation.contentHash}>{creation.contentHash}</span>
									<button type="button" className="aoa-meta text-[var(--signal)]" onClick={() => copyValue('hash', creation.contentHash)}>
										{copiedField === 'hash' ? 'Copied' : 'Copy'}
									</button>
								</dd>
							</div>
						) : null}
						{creation.artifactUrl ? (
							<div>
								<dt className="aoa-meta">IPFS / artifact</dt>
								<dd className="mt-1 flex flex-wrap items-center gap-2">
									<span className="break-all font-mono text-xs" title={creation.artifactUrl}>{creation.artifactUrl}</span>
									<button type="button" className="aoa-meta text-[var(--signal)]" onClick={() => copyValue('artifact', creation.artifactUrl)}>
										{copiedField === 'artifact' ? 'Copied' : 'Copy'}
									</button>
								</dd>
							</div>
						) : null}
					</dl>
					{prompt && (
						<div>
							<p className="aoa-meta">Prompt</p>
							<p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink-dim)]">{prompt}</p>
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

		</div>
	);
}

