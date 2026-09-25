'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import Footer from '@/app/components/Footer';
import ProfileFrame from '@/app/components/profile/ProfileFrame';
import ProfileWalletSummary from '@/app/components/profile/ProfileWalletSummary';
import PublicLinksSettings from '@/app/components/profile/PublicLinksSettings';
import PrivyLinkCheck from '@/app/components/profile/PrivyLinkCheck';
import SafeImage from '@/app/components/SafeImage';
import BrandLogo from '@/app/components/BrandLogo';
import { apeThumb } from '@/lib/profile/avatar';
import { profileHref } from '@/lib/profile/identity';
import LoadingBar from '@/app/components/profile/LoadingBar';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';

type PrivyLinkedAccount = { type?: string; address?: string; chainType?: string };
type PrivyUser = { id?: string; twitter?: { username?: string }; linkedAccounts?: PrivyLinkedAccount[] };

export default function ProfileSettingsPage() {
	const { user, linkTwitter, linkWallet, unlinkWallet, getAccessToken } = (usePrivy() as unknown) as {
		user?: PrivyUser;
		linkTwitter?: () => Promise<void>;
		linkWallet?: () => void;
		unlinkWallet?: (address: string) => Promise<unknown>;
		getAccessToken?: () => Promise<string | null>;
	};
	const session = useSessionWallets();
	const walletAddresses = session.addresses;
	const handle = (user?.twitter?.username || '').replace(/^@/, '');

	const [displayName, setDisplayName] = useState('');
	const [savedName, setSavedName] = useState('');
	const [storedHandle, setStoredHandle] = useState('');
	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [apeIdDraft, setApeIdDraft] = useState('');
	const [savedForever, setSavedForever] = useState<number | null>(null);
	const [owned, setOwned] = useState<number[]>([]);
	const [loading, setLoading] = useState(true);
	const [walletsReady, setWalletsReady] = useState(false);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [xError, setXError] = useState<string | null>(null);

	const [aliases, setAliases] = useState<Record<string, string>>({});
	const [editingWallet, setEditingWallet] = useState<string | null>(null);
	const [aliasDraft, setAliasDraft] = useState('');
	const [aliasSaving, setAliasSaving] = useState(false);
	const [aliasMessage, setAliasMessage] = useState<string | null>(null);
	const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
	const [unlinkingAddress, setUnlinkingAddress] = useState<string | null>(null);
	const [walletMessage, setWalletMessage] = useState<string | null>(null);
	const [changingApe, setChangingApe] = useState(false);
	const [publicByWallet, setPublicByWallet] = useState<Record<string, boolean>>({});
	const [level, setLevel] = useState<number | null>(null);

	const dirty = displayName.trim() !== savedName || foreverApe !== savedForever;
	const publicHref = profileHref(storedHandle || handle);

	const authHeaders = async () => {
		const token = await getAccessToken?.();
		if (!token) throw new Error('Sign in again.');
		return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
	};

	useEffect(() => {
		if (!dirty) return;
		const warn = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	useEffect(() => {
		if (!session.signedIn) return;
		let cancelled = false;
		(async () => {
			try {
				const headers = await authHeaders();
				const params = new URLSearchParams();
				for (const address of walletAddresses) params.append('wallet', address);
				const response = await fetch(`/api/profile/identity?${params}`, { headers, cache: 'no-store' });
				const json = await response.json().catch(() => ({}));
				if (!response.ok || cancelled) return;
				const name = String(json.displayName || '');
				const nextHandle = String(json.handle || handle || '');
				const nextForever = typeof json.foreverApeId === 'number' ? json.foreverApeId : null;
				setDisplayName(name);
				setSavedName(name);
				setStoredHandle(nextHandle);
				setForeverApe(nextForever);
				setApeIdDraft(nextForever != null ? String(nextForever) : '');
				setSavedForever(nextForever);
				setOwned(Array.isArray(json.ownedTokenIds) ? json.ownedTokenIds : []);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [session.signedIn, walletAddresses.join(',')]);

	useEffect(() => {
		if (!session.signedIn) return;
		let cancelled = false;
		(async () => {
			try {
				const headers = await authHeaders();
				const response = await fetch('/api/profile/wallet-alias', { headers, cache: 'no-store' });
				const json = await response.json().catch(() => ({}));
				if (!response.ok || cancelled) return;
				const next: Record<string, string> = {};
				for (const row of json.aliases ?? []) {
					if (row?.walletAddress && row?.alias) next[String(row.walletAddress).toLowerCase()] = String(row.alias);
				}
				setAliases(next);
			} catch {
				/* names stay blank until the session verifies */
			} finally {
				if (!cancelled) setWalletsReady(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [session.signedIn, walletAddresses.join(',')]);

	const saveIdentity = async () => {
		setMessage(null);
		setSaving(true);
		try {
			const headers = await authHeaders();
			if (displayName.trim() !== savedName && !displayName.trim()) throw new Error('Display name cannot be empty.');
			const response = await fetch('/api/profile/identity', {
				method: 'PUT',
				headers,
				body: JSON.stringify({
					...(displayName.trim() !== savedName ? { displayName } : {}),
					...(foreverApe !== savedForever && foreverApe != null ? { foreverApeId: foreverApe } : {}),
					connectedWallets: walletAddresses,
				}),
			});
			const json = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(json?.error || 'Could not save profile settings');
			setSavedName(displayName.trim());
			setDisplayName(displayName.trim());
			setSavedForever(foreverApe);
			setMessage(Array.isArray(json.warnings) && json.warnings[0] ? String(json.warnings[0]) : 'Profile updated');
			setChangingApe(false);
			window.dispatchEvent(new Event('avatar-updated'));
			window.dispatchEvent(new Event('forever-ape-updated'));
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'Could not save profile settings');
		} finally {
			setSaving(false);
		}
	};

	const linkX = async () => {
		setXError(null);
		try {
			await linkTwitter?.();
		} catch (error) {
			const text = error instanceof Error ? error.message : 'Could not link X.';
			setXError(/already linked/i.test(text)
				? 'This X account is already linked to another Privy user. Nothing was unlinked or moved.'
				: text);
		}
	};

	const removable = (address: string) => (user?.linkedAccounts ?? []).some(
		(account) => account.type === 'wallet' && account.address?.toLowerCase() === address,
	) && walletAddresses[0] !== address;

	const saveAlias = async (address: string) => {
		setAliasMessage(null);
		setAliasSaving(true);
		try {
			const headers = await authHeaders();
			const response = await fetch('/api/profile/wallet-alias', {
				method: 'PUT',
				headers,
				body: JSON.stringify({ walletAddress: address, alias: aliasDraft, connectedWallets: walletAddresses }),
			});
			const json = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(json?.error || 'Could not save that name');
			setAliases((current) => ({ ...current, [address.toLowerCase()]: String(json.alias || aliasDraft) }));
			setEditingWallet(null);
			setAliasMessage('Wallet name updated');
		} catch (error) {
			setAliasMessage(error instanceof Error ? error.message : 'Could not save that name');
		} finally {
			setAliasSaving(false);
		}
	};

	const clearAlias = async (address: string) => {
		setAliasMessage(null);
		setAliasSaving(true);
		try {
			const headers = await authHeaders();
			const response = await fetch('/api/profile/wallet-alias', {
				method: 'DELETE',
				headers,
				body: JSON.stringify({ walletAddress: address, connectedWallets: walletAddresses }),
			});
			const json = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(json?.error || 'Could not clear that name');
			setAliases((current) => {
				const next = { ...current };
				delete next[address.toLowerCase()];
				return next;
			});
		} catch (error) {
			setAliasMessage(error instanceof Error ? error.message : 'Could not clear that name');
		} finally {
			setAliasSaving(false);
		}
	};

	useEffect(() => {
		if (!session.signedIn || !user?.id) return;
		let cancelled = false;
		fetch(`/api/progress/me?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' })
			.then((response) => response.json())
			.then((json: { level?: number }) => {
				if (!cancelled && typeof json.level === 'number') setLevel(json.level);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [session.signedIn, user?.id]);

	const discardIdentity = () => {
		setDisplayName(savedName);
		setForeverApe(savedForever);
		setApeIdDraft(savedForever != null ? String(savedForever) : '');
		setMessage(null);
		setChangingApe(false);
	};

	const chooseForeverApe = (id: number) => {
		setForeverApe(id);
		setApeIdDraft(String(id));
	};

	if (!session.signedIn) {
		return (
			<div className="min-h-screen text-[var(--ink)]">
				<ProfileFrame>
					<p className="aoa-meta text-[var(--signal)]">Profile settings</p>
					<h1 className="mt-4 max-w-[18ch] font-[family-name:var(--font-signal-display)] text-4xl font-bold uppercase leading-[0.9] sm:text-6xl">
						Sign in to manage your ape profile.
					</h1>
					<button type="button" className="aoa-home-cta aoa-home-cta-solid mt-8" onClick={() => { void session.login?.(); }}>
						Sign in
					</button>
				</ProfileFrame>
				<Footer />
			</div>
		);
	}

	const nav = [
		['identity', 'Identity'],
		['public', 'Public profile'],
		['wallets', 'Wallets'],
		['accounts', 'Connected accounts'],
	] as const;
	const shownName = displayName.trim() || storedHandle || 'Ape';
	const savedOk = message === 'Profile updated';

	return (
		<div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
			<ProfileFrame>
				<div className="mx-auto max-w-[1120px] pb-28">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="font-[family-name:var(--font-signal-display)] text-[2rem] font-bold uppercase leading-none sm:text-4xl">Profile settings</h1>
						<p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--ink-dim)]">Manage your Ape identity and what other Apes can see.</p>
					</div>
					<Link href="/profile/" className="aoa-home-cta aoa-home-cta-ghost">Back to profile</Link>
				</div>

				<div className="mt-8 border border-white/10 bg-black/40 p-4 sm:p-6">
					{loading ? <LoadingBar label="Loading profile" /> : (
						<div className="flex flex-wrap items-center gap-4">
							<div className="relative h-16 w-16 shrink-0 overflow-hidden border border-white/15 bg-black">
								{foreverApe != null ? <SafeImage src={apeThumb(foreverApe)} alt="" fill className="object-cover" unoptimized /> : <BrandLogo className="h-full w-full" />}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xl font-semibold text-[var(--ink)]">{shownName}</p>
								{storedHandle ? <p className="mt-1 text-[14px] text-[var(--ink-mute)]">@{storedHandle}</p> : null}
								{level != null ? <p className="mt-1 text-[13px] text-[var(--ink-dim)]">Level {level}</p> : null}
							</div>
							{publicHref ? <Link href={publicHref} className="aoa-home-cta aoa-home-cta-ghost">View public profile</Link> : null}
						</div>
					)}
				</div>

				<div className="mt-8 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10">
					<nav className="mb-6 flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:mb-0 lg:block lg:space-y-1" aria-label="Settings sections">
						{nav.map(([id, label]) => (
							<a key={id} href={`#${id}`} className="block whitespace-nowrap px-3 py-2 text-[14px] text-[var(--ink-dim)] hover:text-[var(--ink)] lg:border-l lg:border-white/10 lg:hover:border-[var(--signal)]">
								{label}
							</a>
						))}
					</nav>

					<div className="space-y-12">
						<section id="identity" className="border border-white/10 bg-black/40 p-5 sm:p-8">
							<h2 className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none">Identity</h2>
							<p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">How your Ape appears across Apes on Ape.</p>
							{loading ? <LoadingBar label="Loading identity" /> : (
								<>
									<label className="mt-8 block">
										<span className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-mute)]">Display name</span>
										<input
											value={displayName}
											maxLength={32}
											onChange={(event) => setDisplayName(event.target.value)}
											className="mt-2 w-full border border-white/15 bg-black/50 px-3 py-3 text-base text-[var(--ink)] focus:border-[var(--signal)] focus:outline-none"
										/>
										<span className="mt-2 block text-[13px] leading-relaxed text-[var(--ink-mute)]">Shown on your profile, Ape Board, Studio, and other AOA surfaces.</span>
									</label>
									<div className="mt-8">
										<p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-mute)]">Handle</p>
										{storedHandle ? (
											<>
												<p className="mt-2 text-base text-[var(--ink)]">@{storedHandle}</p>
												<p className="mt-1 text-[14px] text-[var(--ink-dim)]">apesonape.io/profile/{storedHandle}</p>
											</>
										) : (
											<>
												<p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">Link X to publish a public profile URL.</p>
												<button type="button" onClick={() => { void linkX(); }} className="aoa-home-cta aoa-home-cta-solid mt-3">Link X</button>
											</>
										)}
									</div>
									<div className="mt-8 border-t border-white/10 pt-8">
										<p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-mute)]">Forever Ape</p>
										<p className="mt-2 text-[14px] text-[var(--ink-dim)]">The Ape that represents you across AOA.</p>
										<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
											<div className="relative h-28 w-28 shrink-0 overflow-hidden border border-white/15 bg-black">
												{foreverApe != null ? <SafeImage src={apeThumb(foreverApe)} alt="" fill className="object-cover" unoptimized /> : <BrandLogo className="h-full w-full" />}
											</div>
											<div>
												<p className="text-lg text-[var(--ink)]">{foreverApe != null ? `Ape #${foreverApe}` : 'Not chosen yet'}</p>
												<p className="mt-1 max-w-sm text-[14px] leading-relaxed text-[var(--ink-mute)]">Used as your profile image across your profile, Ape Board, Studio, and other AOA surfaces.</p>
												<button type="button" onClick={() => setChangingApe((open) => !open)} className="aoa-home-cta aoa-home-cta-ghost mt-3">
													{changingApe ? 'Close' : 'Change Forever Ape'}
												</button>
											</div>
										</div>
										{changingApe ? (
											<div className="mt-5">
												<p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-mute)]">Select your Forever Ape</p>
												<div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
													{owned.map((id) => {
														const selected = foreverApe === id;
														return (
															<button
																key={id}
																type="button"
																onClick={() => chooseForeverApe(id)}
																className={`relative aspect-square overflow-hidden border-2 ${selected ? 'border-[var(--signal)]' : 'border-white/15'}`}
																aria-label={`Ape ${id}${selected ? ', selected' : ''}`}
																aria-pressed={selected}
															>
																<SafeImage src={apeThumb(id)} alt="" fill className="object-cover" unoptimized />
																{selected ? <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-[var(--signal)] text-[11px] font-bold text-white">✓</span> : null}
															</button>
														);
													})}
												</div>
												<label className="mt-4 block max-w-xs">
													<span className="text-[13px] text-[var(--ink-mute)]">Or enter an Ape ID you hold</span>
													<input
														value={apeIdDraft}
														inputMode="numeric"
														maxLength={6}
														aria-label="Forever Ape ID"
														onChange={(event) => {
															const next = event.target.value.replace(/\D/g, '').slice(0, 6);
															setApeIdDraft(next);
															if (!next) return;
															chooseForeverApe(Number(next));
														}}
														className="mt-2 w-full border border-white/15 bg-black/50 px-3 py-3 font-mono text-base text-[var(--ink)] focus:border-[var(--signal)] focus:outline-none"
													/>
												</label>
												{owned.length === 0 ? <p className="mt-3 text-[14px] text-[var(--ink-mute)]">No held Apes were found on the linked wallets.</p> : null}
											</div>
										) : null}
									</div>
								</>
							)}
						</section>

						<section id="public" className="border border-white/10 bg-black/40 p-5 sm:p-8">
							<h2 className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none">Public profile</h2>
							<p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--ink-dim)]">Choose what visitors can see on your public Ape profile.</p>
							<div className="mt-6">
								<PublicLinksSettings
									embedded
									walletAddresses={walletAddresses}
									getAccessToken={getAccessToken}
									sessionHandle={handle}
									onLinkX={() => { void linkX(); }}
									xError={xError}
									onWallets={(rows) => {
										const next: Record<string, boolean> = {};
										for (const row of rows) next[row.address.toLowerCase()] = row.isPublic;
										setPublicByWallet(next);
									}}
								/>
							</div>
						</section>

						<section id="wallets" className="border border-white/10 bg-black/40 p-5 sm:p-8">
							<h2 className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none">Wallets</h2>
							<p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">Manage wallets connected to your Ape identity. A wallet name is only a label.</p>
							{walletsReady ? null : <LoadingBar label="Loading wallets" />}
							<ProfileWalletSummary
								addresses={walletAddresses}
								aliases={aliases}
								copiedAddress={copiedAddress}
								unlinkingAddress={unlinkingAddress}
								editingAddress={editingWallet}
								draft={aliasDraft}
								saving={aliasSaving}
								message={aliasMessage || walletMessage}
								removable={removable}
								publicState={(address) => {
									const value = publicByWallet[address.toLowerCase()];
									return value == null ? null : value;
								}}
								relationLabel={(address) => {
									const onPrivy = (user?.linkedAccounts ?? []).some(
										(account) => account.type === 'wallet' && account.address?.toLowerCase() === address,
									);
									if (walletAddresses[0] === address && onPrivy) return 'Primary wallet';
									if (onPrivy) return 'Linked wallet';
									return 'Connected for this visit';
								}}
								onCopy={(address) => {
									void navigator.clipboard.writeText(address);
									setCopiedAddress(address);
									setTimeout(() => setCopiedAddress((current) => (current === address ? null : current)), 2000);
								}}
								onLink={() => {
									void (async () => {
										setWalletMessage(null);
										if (!linkWallet) {
											setWalletMessage('Wallet linking is not available in this session.');
											return;
										}
										try {
											await Promise.resolve(linkWallet());
										} catch (error) {
											const text = error instanceof Error ? error.message : 'Could not link that wallet.';
											setWalletMessage(/already|another|existing user|linked to/i.test(text)
												? 'This wallet is already associated with another AOA/Privy identity. It was not attached.'
												: text);
										}
									})();
								}}
								onRemove={(address) => {
									void (async () => {
										if (walletAddresses.length < 2 || !unlinkWallet) return;
										const stored = (user?.linkedAccounts ?? []).find(
											(account) => account.type === 'wallet' && account.address?.toLowerCase() === address,
										)?.address;
										try {
											setUnlinkingAddress(address);
											await unlinkWallet(stored || address);
										} catch (error) {
											setWalletMessage(error instanceof Error ? error.message : 'Could not remove that wallet');
										} finally {
											setUnlinkingAddress(null);
										}
									})();
								}}
								onEdit={(address) => {
									setAliasMessage(null);
									setEditingWallet(address);
									setAliasDraft(aliases[address.toLowerCase()] || '');
								}}
								onDraft={setAliasDraft}
								onSave={(address) => { void saveAlias(address); }}
								onCancel={() => setEditingWallet(null)}
								onClear={(address) => { void clearAlias(address); }}
							/>
						</section>

						<section id="accounts" className="border border-white/10 bg-black/40 p-5 sm:p-8">
							<h2 className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none">Connected accounts</h2>
							<p className="mt-2 text-[14px] text-[var(--ink-dim)]">How you sign in. This does not change what visitors see.</p>
							<ul className="mt-5 space-y-3 text-[15px]">
								<li className="flex items-center justify-between gap-4 border-b border-white/10 pb-3"><span>Glyph / Privy</span><span className="text-[var(--ink-dim)]">Connected</span></li>
								<li className="flex items-center justify-between gap-4 border-b border-white/10 pb-3"><span>X</span><span className="text-[var(--ink-dim)]">{handle || storedHandle ? 'Connected' : 'Not connected'}</span></li>
								<li className="flex items-center justify-between gap-4"><span>Wallets</span><span className="text-[var(--ink-dim)]">{walletAddresses.length} connected</span></li>
							</ul>
							<div className="mt-6">
								<p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-mute)]">Advanced account info</p>
								<PrivyLinkCheck addresses={walletAddresses} getAccessToken={getAccessToken} />
							</div>
						</section>
					</div>
				</div>
				</div>

				{dirty || message ? (
					<div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-black/95 px-4 py-3 sm:px-6" style={{ paddingBottom: 'calc(var(--aoa-dock-offset, 0px) + 0.75rem)' }}>
						<div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3">
							<p className={`text-[14px] ${message && !savedOk ? 'text-red-300' : 'text-[var(--ink)]'}`}>
								{dirty ? 'Unsaved changes' : savedOk ? 'Profile updated' : message}
							</p>
							<div className="flex gap-2">
								{dirty ? <button type="button" onClick={discardIdentity} className="aoa-home-cta aoa-home-cta-ghost">Discard</button> : null}
								{dirty ? (
									<button type="button" onClick={() => { void saveIdentity(); }} disabled={saving} className="aoa-home-cta aoa-home-cta-solid disabled:opacity-40">
										{saving ? 'Saving' : 'Save changes'}
									</button>
								) : null}
							</div>
						</div>
					</div>
				) : null}
			</ProfileFrame>
			<Footer />
		</div>
	);
}
