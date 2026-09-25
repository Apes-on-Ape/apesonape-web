'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
import type { CreationType } from '@/lib/studio/types';

const TITLE_LIMIT = 80;
const PROMPT_LIMIT = 1000;
const MAX_FILE_MB = Number(process.env.NEXT_PUBLIC_STUDIO_MAX_FILE_MB || '20');

type PrivyUser = { twitter?: { username?: string } };

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function StudioPublishPage() {
	const session = useSessionWallets();
	const privy = (usePrivy() as unknown) as {
		user?: (PrivyUser & { id?: string }) | null;
		getAccessToken?: () => Promise<string | null>;
	};
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
	const [savedHash, setSavedHash] = useState<string | null>(null);

	const isConnected = session.signedIn && !!session.primaryAddress;
	const address = session.primaryAddress;
	const xHandle = privy?.user?.twitter?.username || '';
	const glyphVerified = !!xHandle;
	const glyphId = session.userId;
	const privyUserId = privy?.user?.id || '';
	const canPublish = isConnected && !!address;
	const linkedWallets = session.addresses.map((address) => ({ address }));

	useEffect(() => {
		return () => {
			if (artifactPreview) URL.revokeObjectURL(artifactPreview);
		};
	}, [artifactPreview]);

	const onFileChange = (file: File | null) => {
		setArtifact(file);
		setError(null);
		setSuccessId(null);
		setSavedHash(null);
		if (artifactPreview) URL.revokeObjectURL(artifactPreview);
		if (file) {
			setArtifactPreview(URL.createObjectURL(file));
		} else {
			setArtifactPreview(null);
		}
	};

	const handlePublish = async (e: React.FormEvent) => {
		e.preventDefault();
		if (busy) return;
		setError(null);
		setSuccessId(null);
		setSavedHash(null);

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
		if (privyUserId) form.append('privyUserId', privyUserId);
		if (xHandle) form.append('xHandle', xHandle);
		form.append('glyphVerified', glyphVerified ? 'true' : 'false');
		if (artifact) {
			form.append('artifact', artifact);
		}

		try {
			setBusy(true);
			setStatus('Uploading artifact');
			const token = await privy.getAccessToken?.();
			const res = await fetch('/api/studio/creations', {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: form,
			});
			const json = await res.json();
			if (!res.ok) {
				throw new Error(json?.error || 'Publish failed');
			}
			setStatus('Transmission complete');
			const creationId = json?.creation?.id as string | undefined;
			const hash = json?.creation?.contentHash;
			if (typeof hash === 'string') setSavedHash(hash);
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
		<div className="min-h-screen flex flex-col text-[var(--ink)]">
			<main className="flex-1 container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
				<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="aoa-meta text-[var(--signal)]">AOA Lab</p>
						<h1 className="type-section mt-2">Transmit an artifact</h1>
						<p className="mt-2 max-w-xl text-sm text-[var(--ink-dim)]">Upload the image, add the title and prompt, then publish the record.</p>
					</div>
					{isConnected ? (
						<p className="aoa-meta">Session ready · {shortAddress(address)}</p>
					) : (
						<button type="button" onClick={() => { void session.login?.(); }} className="aoa-home-cta aoa-home-cta-solid">
							Sign in
						</button>
					)}
				</div>

				<form onSubmit={handlePublish} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
					<div>
						<p className="aoa-meta text-[var(--signal)]">01 // Artifact</p>
						<label
							htmlFor="studio-artifact"
							className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[rgba(243,238,228,0.28)] px-4 py-8 text-center"
							onDragOver={(event) => {
								event.preventDefault();
							}}
							onDrop={(event) => {
								event.preventDefault();
								if (!canPublish) return;
								onFileChange(event.dataTransfer.files?.[0] || null);
							}}
						>
							<input
								id="studio-artifact"
								type="file"
								accept="image/*"
								className="sr-only"
								onChange={(e) => onFileChange(e.target.files?.[0] || null)}
								disabled={!canPublish}
							/>
							<UploadCloud className="h-6 w-6" aria-hidden />
							<span className="text-sm">Drop an image or choose a file</span>
							<span className="aoa-meta">Images only · max {MAX_FILE_MB}MB</span>
						</label>
						{artifact ? (
							<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
								<p className="aoa-meta min-w-0 break-all">
									{artifact.name} · {(artifact.size / (1024 * 1024)).toFixed(2)} MB
								</p>
								<button type="button" className="aoa-meta text-[var(--signal)]" onClick={() => onFileChange(null)}>
									Remove
								</button>
							</div>
						) : null}
						<div className="relative mt-4 aspect-square overflow-hidden border border-[rgba(243,238,228,0.12)] bg-black/40">
							{artifactPreview ? (
								<img src={artifactPreview} alt="Artifact preview" className="h-full w-full object-contain" />
							) : (
								<p className="aoa-meta flex h-full items-center justify-center">No file selected</p>
							)}
						</div>
					</div>

					<div className="space-y-5">
						<div>
							<p className="aoa-meta text-[var(--signal)]">02 // Context</p>
							<label htmlFor="studio-title" className="mt-3 block text-sm">Title</label>
							<input
								id="studio-title"
								value={title}
								onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
								required
								className="mt-2 w-full min-h-11 border border-[rgba(243,238,228,0.18)] bg-transparent px-3 text-sm text-[var(--ink)]"
								disabled={!canPublish}
							/>
							<p className="aoa-meta mt-1">{title.length}/{TITLE_LIMIT}</p>
						</div>
						<div>
							<label htmlFor="studio-prompt" className="block text-sm">Prompt / creation context</label>
							<textarea
								id="studio-prompt"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_LIMIT))}
								rows={5}
								required
								className="mt-2 w-full border border-[rgba(243,238,228,0.18)] bg-transparent px-3 py-2 text-sm text-[var(--ink)]"
								disabled={!canPublish}
							/>
							<p className="aoa-meta mt-1">{prompt.length}/{PROMPT_LIMIT}</p>
						</div>
						<div>
							<p className="aoa-meta text-[var(--signal)]">03 // Verify</p>
							<ul className="mt-3 space-y-1 text-sm text-[var(--ink-dim)]">
								<li>Image and prompt are stored. IPFS is tried first.</li>
								<li>Metadata is hashed with keccak256.</li>
								<li>Glyph: {glyphVerified ? 'verified' : 'not verified'}.</li>
								<li>Wallet: {shortAddress(address) || 'not connected'}.</li>
							</ul>
						</div>
						{error ? (
							<p className="flex items-start gap-2 text-sm text-red-300" role="alert">
								<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
								<span>{error}</span>
							</p>
						) : null}
						{status ? <p className="aoa-meta text-[var(--signal)]">{status}</p> : null}
						{successId ? (
							<div className="border border-[rgba(243,238,228,0.12)] p-4">
								<p className="flex items-center gap-2 text-sm">
									<CheckCircle2 className="h-4 w-4 text-[var(--signal)]" />
									Transmission complete.
								</p>
								<p className="aoa-meta mt-2 break-all">Artifact // {successId}</p>
								{savedHash ? <p className="aoa-meta mt-1 break-all">Hash // {savedHash}</p> : null}
								<Link href={`/studio/${successId}`} className="aoa-home-cta aoa-home-cta-solid mt-4">View artifact</Link>
							</div>
						) : null}
						<div className="flex flex-col gap-2 min-[420px]:flex-row">
							<p className="aoa-meta text-[var(--signal)] min-[420px]:self-center">04 // Transmit</p>
							<button type="submit" className="aoa-home-cta aoa-home-cta-solid" disabled={busy || !isConnected}>
								{busy ? 'Uploading artifact' : 'Transmit artifact'}
							</button>
							<Link href="/studio" className="aoa-home-cta aoa-home-cta-ghost">Back to the lab</Link>
						</div>
					</div>
				</form>
			</main>
			<Footer />
		</div>
	);
}

