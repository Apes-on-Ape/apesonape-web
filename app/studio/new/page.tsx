'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import SafeImage from '@/app/components/SafeImage';
import { useGlyph } from '@use-glyph/sdk-react';
import { usePrivy } from '@privy-io/react-auth';
import type { CreationType } from '@/lib/studio/types';

const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 280;
const TAG_LIMIT = 5;
const MAX_FILE_MB = Number(process.env.NEXT_PUBLIC_STUDIO_MAX_FILE_MB || '20');

type GlyphUser = { id?: string; evmWallet?: string; smartWallet?: string; authenticated?: boolean; hasTwitter?: boolean; hasProfile?: boolean };
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

	const [type, setType] = useState<CreationType>('visual');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [tagsInput, setTagsInput] = useState('');
	const [artifact, setArtifact] = useState<File | null>(null);
	const [artifactPreview, setArtifactPreview] = useState<string | null>(null);
	const [codeText, setCodeText] = useState('');
	const [soundSource, setSoundSource] = useState<'upload' | 'soundcloud' | 'spotify'>('upload');
	const [soundUrl, setSoundUrl] = useState('');
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

	useEffect(() => {
		return () => {
			if (artifactPreview) URL.revokeObjectURL(artifactPreview);
		};
	}, [artifactPreview]);

	const tags = useMemo(() => {
		return tagsInput
			.split(',')
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean)
			.slice(0, TAG_LIMIT);
	}, [tagsInput]);

	const onFileChange = (file: File | null) => {
		setArtifact(file);
		setError(null);
		setSuccessId(null);
		if (artifactPreview) URL.revokeObjectURL(artifactPreview);
		if (file) {
			const url = URL.createObjectURL(file);
			setArtifactPreview(url);
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
		if (description.length > DESCRIPTION_LIMIT) {
			setError(`Description must be <= ${DESCRIPTION_LIMIT} characters`);
			return;
		}
		if (tags.length > TAG_LIMIT) {
			setError(`Max ${TAG_LIMIT} tags`);
			return;
		}
		if (type === 'code') {
			if (!codeText.trim()) {
				setError('Paste your code to publish.');
				return;
			}
		} else if (type === 'sound' && soundSource !== 'upload') {
			if (!soundUrl.trim()) {
				setError('Provide a SoundCloud or Spotify link.');
				return;
			}
			const allowed =
				soundUrl.includes('soundcloud.com') ||
				soundUrl.includes('open.spotify.com') ||
				soundUrl.includes('spotify.com');
			if (!allowed) {
				setError('Link must be from SoundCloud or Spotify.');
				return;
			}
		} else {
			if (!artifact) {
				setError('Please upload a file for this experiment.');
				return;
			}
			if (artifact.size > MAX_FILE_MB * 1024 * 1024) {
				setError(`File too large. Max ${MAX_FILE_MB}MB.`);
				return;
			}
		}

		const form = new FormData();
		form.append('type', type);
		form.append('title', title);
		form.append('description', description);
		form.append('tags', JSON.stringify(tags));
		form.append('creatorAddress', address);
		if (glyphId) form.append('glyphId', glyphId);
		if (xHandle) form.append('xHandle', xHandle);
		form.append('glyphVerified', glyphVerified ? 'true' : 'false');
		if (type === 'code') {
			form.append('code', codeText);
		} else if (type === 'sound' && soundSource !== 'upload') {
			form.append('soundUrl', soundUrl);
			form.append('soundProvider', soundSource);
		} else if (artifact) {
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

	const typeDescription: Record<CreationType, string> = {
		visual: 'Images, covers, posters, album art.',
		sound: 'WAV/MP3/OGG audio creations.',
		interactive: 'HTML/JS bundles or playable prototypes.',
		code: 'Pasted snippets or sketches.',
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
								Sound, art, code, interactive creations. Attributed to your wallet and shared publicly.
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
						<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
							{(['visual', 'sound', 'interactive', 'code'] as CreationType[]).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setType(t)}
									className={`rounded-lg border px-4 py-3 text-left transition-colors ${
										type === t
											? 'border-hero-blue bg-hero-blue/10 text-hero-blue'
											: 'border-white/10 bg-black/40 hover:border-white/30'
									}`}
									disabled={!canPublish}
								>
									<div className="font-semibold capitalize">{t}</div>
									<div className="text-xs text-off-white/70">{typeDescription[t]}</div>
								</button>
							))}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm mb-1">Title</label>
								<input
									value={title}
									onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
									required
									className="w-full rounded-md bg-black/40 border border-white/10 p-3"
									placeholder="Give your experiment a name"
									disabled={!canPublish}
								/>
								<div className="text-xs text-off-white/60 mt-1">{title.length}/{TITLE_LIMIT}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Tags (comma separated, max {TAG_LIMIT})</label>
								<input
									value={tagsInput}
									onChange={(e) => setTagsInput(e.target.value)}
									className="w-full rounded-md bg-black/40 border border-white/10 p-3"
									placeholder="sound, glitch, prototype"
									disabled={!canPublish}
								/>
								<div className="text-xs text-off-white/60 mt-1">
									{tags.length} / {TAG_LIMIT} tags
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm mb-1">Description</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_LIMIT))}
								rows={3}
								className="w-full rounded-md bg-black/40 border border-white/10 p-3"
								placeholder="What is this experiment? Tools, inspirations, context."
								disabled={!canPublish}
							/>
							<div className="text-xs text-off-white/60 mt-1">{description.length}/{DESCRIPTION_LIMIT}</div>
						</div>

						{type === 'code' ? (
							<div>
								<label className="block text-sm mb-2">Paste your code</label>
								<textarea
									value={codeText}
									onChange={(e) => setCodeText(e.target.value)}
									rows={10}
									className="w-full rounded-lg bg-black/50 border border-dashed border-white/15 p-3 font-mono text-sm"
									placeholder="// drop your snippet here"
								disabled={!canPublish}
								/>
								<p className="text-xs text-off-white/60 mt-1">Plain text is stored and hashed before publish.</p>
							</div>
						) : type === 'sound' ? (
							<div className="space-y-4">
								<div className="flex flex-col gap-2">
									<label className="block text-sm">Sound source</label>
									<select
										value={soundSource}
										onChange={(e) => setSoundSource(e.target.value as 'upload' | 'soundcloud' | 'spotify')}
										className="rounded-md bg-black/40 border border-white/10 p-3 text-sm w-full md:w-72"
										disabled={!canPublish}
									>
										<option value="upload">Upload audio file</option>
										<option value="soundcloud">SoundCloud URL</option>
										<option value="spotify">Spotify URL</option>
									</select>
								</div>

								{soundSource !== 'upload' ? (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm mb-1">Track/album URL</label>
											<input
												value={soundUrl}
												onChange={(e) => setSoundUrl(e.target.value)}
												className="w-full rounded-md bg-black/40 border border-white/10 p-3"
												placeholder="https://soundcloud.com/artist/track or https://open.spotify.com/..."
												disabled={!canPublish}
											/>
											<p className="text-xs text-off-white/60 mt-1">We use the link for preview; “Open artifact” goes to the original page.</p>
										</div>
										<div>
											<label className="block text-sm mb-2">Preview</label>
											<div className="rounded-lg border border-white/15 bg-black/50 h-64 flex items-center justify-center overflow-hidden relative p-3">
												{soundUrl ? (
													<div className="w-full h-full">
														{soundUrl.includes('soundcloud.com') ? (
															<iframe
																title="SoundCloud preview"
																width="100%"
																height="100%"
																allow="autoplay"
																src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundUrl)}&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`}
															/>
														) : soundUrl.includes('spotify.com') ? (
															<iframe
																title="Spotify preview"
																width="100%"
																height="100%"
																allow="encrypted-media"
																src={soundUrl.replace('open.spotify.com/', 'open.spotify.com/embed/')}
															/>
														) : (
															<div className="text-off-white/60 text-sm">Enter a valid SoundCloud or Spotify URL</div>
														)}
													</div>
												) : (
													<div className="text-off-white/50 text-sm">Paste a link to preview</div>
												)}
											</div>
										</div>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm mb-2">Upload artifact</label>
											<label className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/40 hover:bg-black/30 transition-colors p-6 cursor-pointer">
												<input
													type="file"
													accept="audio/*"
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
													<audio controls className="w-full">
														<source src={artifactPreview} />
													</audio>
												) : (
													<div className="text-off-white/50 text-sm">No file selected</div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm mb-2">Upload artifact</label>
									<label className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/40 hover:bg-black/30 transition-colors p-6 cursor-pointer">
										<input
											type="file"
											accept={type === 'visual' ? 'image/*' : '*/*'}
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
						)}

						<div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-off-white/80">
							<div className="font-semibold mb-2">What happens on publish</div>
							<ul className="list-disc list-inside space-y-1 text-off-white/70">
								<li>Artifact is uploaded (IPFS first; local fallback in dev).</li>
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

