'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keccak256, stringToBytes } from 'viem';
import { BadgeCheck, Copy, ExternalLink, ShieldAlert, AlertTriangle, Trash2 } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri, gatewayCandidates } from '@/lib/studio/urls';
import { useGlyph } from '@use-glyph/sdk-react';

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type Props = {
	creation: CreationRecord;
};

export default function CreationDetailClient({ creation }: Props) {
	const [metadataJson, setMetadataJson] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
	const [integrityOk, setIntegrityOk] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const glyph = (useGlyph() as unknown) as {
		user?: { id?: string; evmWallet?: string; smartWallet?: string };
	};
	const router = useRouter();

	const metadataGateways = gatewayCandidates(creation.metadataUrl);
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
				setError(null);
				setIntegrityOk(null);
				let text: string | null = null;
				for (const url of metadataGateways) {
					try {
						const res = await fetch(url, { cache: 'no-store' });
						if (!res.ok) continue;
						text = await res.text();
						break;
					} catch {
						continue;
					}
				}
				if (!text) throw new Error('Failed to fetch metadata from IPFS gateways');
				if (cancelled) return;
				setMetadataJson(text);
				try {
					setMetadata(JSON.parse(text));
				} catch {
					setMetadata(null);
				}
				const hash = keccak256(stringToBytes(text));
				setIntegrityOk(hash === creation.contentHash);
			} catch (err: unknown) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Failed to load metadata');
					setIntegrityOk(false);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [creation.contentHash, metadataGateways]);

	const artifactGateways = gatewayCandidates(creation.artifactUrl);
	const artifactUri = artifactGateways[0];
	const metaArtifact = (metadata?.artifact as Record<string, unknown>) || {};
	const codeText = (metaArtifact?.text as string | undefined) || creation.codePreview || '';
	const externalUrl = metaArtifact?.externalUrl as string | undefined;
	const soundUrl = externalUrl || creation.artifact.externalUrl || artifactUri;

	const copyHash = async () => {
		try {
			await navigator.clipboard.writeText(creation.contentHash);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};

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

	return (
		<div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
				<div>
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hero-blue/40 text-hero-blue text-sm font-semibold">
						{creation.type.toUpperCase()} experiment
					</div>
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
					{creation.type === 'visual' && (
						<SafeImage src={artifactUri} alt={creation.title} className="w-full h-full object-contain" fill />
					)}
					{creation.type === 'sound' && (
						<div className="p-3 flex flex-col gap-3 h-full">
							<div className="text-off-white/80 text-sm">Listen</div>
							{soundUrl.includes('soundcloud.com') ? (
								<iframe
									title="SoundCloud player"
									width="100%"
									height="320"
									allow="autoplay"
									src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundUrl)}&auto_play=false&show_comments=true&show_user=true&visual=true`}
								/>
							) : soundUrl.includes('spotify.com') ? (
								<iframe
									title="Spotify player"
									width="100%"
									height="320"
									allow="encrypted-media"
									src={soundUrl.replace('open.spotify.com/', 'open.spotify.com/embed/')}
								/>
							) : (
								<audio controls className="w-full">
									<source src={artifactUri} />
								</audio>
							)}
						</div>
					)}
					{creation.type === 'interactive' && (
						<iframe
							src={artifactUri}
							className="w-full h-[420px] border-0"
							sandbox="allow-scripts allow-forms"
							title="Interactive experiment"
						/>
					)}
					{creation.type === 'code' && (
						<div className="p-4">
							<div className="text-sm text-off-white/70 mb-2">Code</div>
							<pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-[420px] overflow-auto">
								{codeText || '// No code snippet found in metadata'}
							</pre>
						</div>
					)}
				</div>
				<div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4">
					<div>
						<div className="flex items-center justify-between text-sm">
							<div className="font-semibold">Content hash</div>
							<button
								type="button"
								onClick={copyHash}
								className="inline-flex items-center gap-1 text-hero-blue text-xs"
							>
								<Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}
							</button>
						</div>
						<p className="text-xs break-all mt-1 text-off-white/80">{creation.contentHash}</p>
						{integrityOk === true && (
							<div className="text-green-400 text-xs mt-2 inline-flex items-center gap-1">
								<BadgeCheck className="w-4 h-4" /> Metadata integrity verified
							</div>
						)}
						{integrityOk === false && (
							<div className="text-amber-300 text-xs mt-2 inline-flex items-center gap-1">
								<AlertTriangle className="w-4 h-4" /> Hash mismatch — metadata may be tampered
							</div>
						)}
						{integrityOk === null && (
							<div className="text-off-white/60 text-xs mt-2">Checking integrity…</div>
						)}
						{error && <div className="text-red-300 text-xs mt-1">{error}</div>}
					</div>
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
					{metadataJson && (
						<div>
							<div className="font-semibold text-sm mb-1">Metadata JSON</div>
							<pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-[220px] overflow-auto text-off-white/80">
								{metadataJson}
							</pre>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

