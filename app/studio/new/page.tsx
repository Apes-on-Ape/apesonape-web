'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import { useGlyph } from '@use-glyph/sdk-react';
import { usePrivy } from '@privy-io/react-auth';
import type { CreationType } from '@/lib/studio/types';

const TITLE_LIMIT = 80;
const PROMPT_LIMIT = 1000;
const MAX_FILE_MB = Number(process.env.NEXT_PUBLIC_STUDIO_MAX_FILE_MB || '20');

type GlyphUser = {
	id?: string;
	evmWallet?: string;
	smartWallet?: string;
	authenticated?: boolean;
	hasTwitter?: boolean;
	hasProfile?: boolean;
	linkedWallets?: Array<{ address?: string; walletClientType?: string }>;
};
type PrivyUser = { twitter?: { username?: string } };

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function StudioPublishPage() {
	const glyph = (useGlyph() as unknown) as {
		user?: GlyphUser | null;
		authenticated?: boolean;
		login?: () => Promise<void>;
	};
	const privy = (usePrivy() as unknown) as { user?: PrivyUser | null };
	const router = useRouter();

	const type: CreationType = 'visual';
	const [title, setTitle] = useState('');
	const [prompt, setPrompt] = useState('');
	const [artifact, setArtifact] = useState<File | null>(null);
	const [artifactPreview, setArtifactPreview] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [successId, setSuccessId] = useState<string | null>(null);

	const isConnected = !!(glyph?.user || glyph?.authenticated);
	const address = glyph?.user?.evmWallet || glyph?.user?.smartWallet || '';
	const xHandle = privy?.user?.twitter?.username || '';
	const glyphVerified = !!glyph?.user?.hasTwitter || !!glyph?.user?.hasProfile;
	const glyphId = glyph?.user?.id || '';
	const canPublish = isConnected && !!address;
	const linkedWallets = glyph?.user?.linkedWallets || [];

	useEffect(() => {
		return () => {
			if (artifactPreview) URL.revokeObjectURL(artifactPreview);
		};
	}, [artifactPreview]);

	const onFileChange = (file: File | null) => {
		setArtifact(file);
		setError(null);
		setSuccessId(null);
		if (artifactPreview) URL.revokeObjectURL(artifactPreview);
		if (file) {
			setArtifactPreview(URL.createObjectURL(file));
		} else {
			setArtifactPreview(null);
		}
	};

	const handlePublish = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessId(null);

		if (!canPublish) {
			setError('Connect your wallet with Glyph to publish.');
			return;
		}
		if (!title.trim()) {
			setError('Title is required');
			return;
		}
		if (title.length > TITLE_LIMIT) {
			setError(`Title must be <= ${TITLE_LIMIT} characters`);
			return;
		}
		if (!prompt.trim()) {
			setError('Prompt is required');
			return;
		}
		if (prompt.length > PROMPT_LIMIT) {
			setError(`Prompt must be <= ${PROMPT_LIMIT} characters`);
			return;
		}
		if (!artifact) {
			setError('Please upload the generated image.');
			return;
		}
		if (artifact.size > MAX_FILE_MB * 1024 * 1024) {
			setError(`File too large. Max ${MAX_FILE_MB}MB.`);
			return;
		}
		if (!artifact.type.startsWith('image/')) {
			setError('Only image uploads are supported.');
			return;
		}
		const form = new FormData();
		form.append('type', type);
		form.append('title', title);
		form.append('prompt', prompt);
		form.append('creatorAddress', address);
		if (linkedWallets.length > 0) {
			form.append('linkedWallets', JSON.stringify(linkedWallets));
		}
		if (glyphId) form.append('glyphId', glyphId);
		if (xHandle) form.append('xHandle', xHandle);
		form.append('glyphVerified', glyphVerified ? 'true' : 'false');
		if (artifact) {
			form.append('artifact', artifact);
		}

		try {
			setBusy(true);
			setStatus('Uploading to storage...');
			const res = await fetch('/api/studio/creations', {
				method: 'POST',
				body: form,
			});
			const json = await res.json();
			if (!res.ok) {
				throw new Error(json?.error || 'Publish failed');
			}
			setStatus('Saved! Redirecting...');
			const creationId = json?.creation?.id as string | undefined;
			if (creationId) {
				setSuccessId(creationId);
				setTimeout(() => router.push(`/studio/${creationId}`), 650);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to publish');
		} finally {
			setBusy(false);
			setStatus('');
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Nav />
			<main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
				<div className="glass-dark border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl shadow-black/40">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
						<div>
							<h1 className="text-3xl font-bold">Publish to AOA Studio</h1>
							<p className="text-off-white/70 text-sm mt-1">
								Publish your prompt with an image. Others can remix using the same prompt.
							</p>
						</div>
						<div className="flex items-center gap-3 text-sm">
							{isConnected ? (
								<div className="px-3 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-200">
									Connected {shortAddress(address)}
								</div>
							) : (
								<button
									onClick={() => { void glyph?.login?.(); }}
									className="btn-primary px-4 py-2"
								>
									Connect with Glyph
								</button>
							)}
						</div>
					</div>

					<form onSubmit={handlePublish} className="space-y-5">
						<div>
							<label className="block text-sm mb-1">Title</label>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
								required
								className="w-full rounded-md bg-black/40 border border-white/10 p-3"
								placeholder="Give your prompt a name"
								disabled={!canPublish}
							/>
							<div className="text-xs text-off-white/60 mt-1">{title.length}/{TITLE_LIMIT}</div>
						</div>

						<div>
							<label className="block text-sm mb-1">AI prompt</label>
							<textarea
								value={prompt}
								onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_LIMIT))}
								rows={4}
								className="w-full rounded-md bg-black/40 border border-white/10 p-3"
								placeholder="Describe the image you want generated..."
								disabled={!canPublish}
							/>
							<div className="text-xs text-off-white/60 mt-1">{prompt.length}/{PROMPT_LIMIT}</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm mb-2">Upload generated image</label>
								<label className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/40 hover:bg-black/30 transition-colors p-6 cursor-pointer">
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => onFileChange(e.target.files?.[0] || null)}
										disabled={!canPublish}
									/>
									<UploadCloud className="w-7 h-7 text-off-white/70" />
									<div className="text-center text-sm text-off-white/80">Drag & drop or click to upload</div>
									<div className="text-center text-xs text-off-white/60">Max {MAX_FILE_MB}MB</div>
								</label>
								{artifact && (
									<div className="text-xs text-off-white/70 mt-2">Selected: {artifact.name}</div>
								)}
							</div>
							<div>
								<label className="block text-sm mb-2">Preview</label>
								<div className="rounded-lg border border-white/15 bg-black/50 h-64 flex items-center justify-center overflow-hidden relative">
									{artifactPreview ? (
										<img
											src={artifactPreview}
											alt="Preview"
											className="object-contain w-full h-full"
											style={{ maxHeight: '16rem' }}
										/>
									) : (
										<div className="text-off-white/50 text-sm">No file selected</div>
									)}
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-off-white/80">
							<div className="font-semibold mb-2">What happens on publish</div>
							<ul className="list-disc list-inside space-y-1 text-off-white/70">
								<li>Your prompt and image are uploaded (IPFS first; local fallback in dev).</li>
								<li>Metadata JSON is built, hashed (keccak256), and pinned.</li>
								<li>Glyph identity is stored ({glyphVerified ? 'verified' : 'not verified'}).</li>
								<li>Your wallet ({shortAddress(address) || 'not connected'}) is attributed.</li>
							</ul>
						</div>

						{error && (
							<div className="flex items-center gap-2 text-red-300 text-sm">
								<AlertCircle className="w-4 h-4" />
								<span>{error}</span>
							</div>
						)}
						{status && (
							<div className="text-sm text-off-white/70">{status}</div>
						)}
						{successId && (
							<div className="flex items-center gap-2 text-green-300 text-sm">
								<CheckCircle2 className="w-4 h-4" />
								<span>Published! </span>
								<Link href={`/studio/${successId}`} className="underline">View your experiment</Link>
							</div>
						)}

						<div className="flex items-center gap-3">
							<button
								type="submit"
								className="btn-primary px-5 py-2"
								disabled={busy || !isConnected}
							>
								{busy ? 'Publishing…' : 'Publish'}
							</button>
							<Link href="/studio" className="btn-secondary px-4 py-2 text-sm">
								Back to Studio
							</Link>
						</div>
					</form>
				</div>
			</main>
			<Footer />
		</div>
	);
}

