'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { shortAddress } from './format';
import LoadingBar from './LoadingBar';
import SettingsToggle from './SettingsToggle';

type WalletRow = { address: string; alias: string | null; isPublic: boolean };

export default function PublicLinksSettings({
	walletAddresses,
	getAccessToken,
	embedded = false,
	sessionHandle,
	onLinkX,
	xError,
	onWallets,
}: {
	walletAddresses: string[];
	getAccessToken?: () => Promise<string | null>;
	embedded?: boolean;
	sessionHandle?: string;
	onLinkX?: () => void;
	xError?: string | null;
	onWallets?: (wallets: WalletRow[]) => void;
}) {
	const [handle, setHandle] = useState<string | null>(null);
	const [showX, setShowX] = useState(false);
	const [wallets, setWallets] = useState<WalletRow[]>([]);
	const [message, setMessage] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [ready, setReady] = useState(false);
	const key = walletAddresses.join(',');
	const visibleHandle = (handle || sessionHandle || '').replace(/^@/, '');
	const onWalletsRef = useRef(onWallets);
	onWalletsRef.current = onWallets;

	const load = useCallback(async () => {
		try {
			const token = await getAccessToken?.();
			if (!token) return;
			const params = new URLSearchParams();
			for (const address of key ? key.split(',') : []) params.append('wallet', address);
			const response = await fetch(`/api/profile/public-links?${params}`, {
				headers: { Authorization: `Bearer ${token}` },
				cache: 'no-store',
			});
			if (!response.ok) return;
			const json = await response.json();
			const next = Array.isArray(json.wallets) ? json.wallets as WalletRow[] : [];
			setHandle(json.xHandle ?? null);
			setShowX(Boolean(json.showX));
			setWallets(next);
			onWalletsRef.current?.(next);
		} finally {
			setReady(true);
		}
	}, [getAccessToken, key]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		if (!notice) return;
		const timer = window.setTimeout(() => setNotice(null), 2500);
		return () => window.clearTimeout(timer);
	}, [notice]);

	const save = async (nextShowX: boolean, nextWallets: WalletRow[]) => {
		const token = await getAccessToken?.();
		if (!token) return;
		setSaving(true);
		setMessage(null);
		setNotice(null);
		try {
			const response = await fetch('/api/profile/public-links', {
				method: 'PUT',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					showX: nextShowX,
					publicWallets: nextWallets.filter((wallet) => wallet.isPublic).map((wallet) => wallet.address),
					connectedWallets: key ? key.split(',') : [],
				}),
			});
			const json = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(json?.error || 'Could not save public links');
			setShowX(nextShowX);
			setWallets(nextWallets);
			onWalletsRef.current?.(nextWallets);
			setNotice('Public profile updated ✓');
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'Could not save public links');
			void load();
		} finally {
			setSaving(false);
		}
	};

	if (!ready) {
		return <LoadingBar label="Loading public profile" />;
	}

	return (
		<div id="public-links" className={embedded ? '' : 'mt-10 max-w-3xl border-t border-white/10 pt-6'}>
			{embedded ? null : <h2 className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none">Public profile</h2>}
			<div className="border border-white/10 bg-black/30 p-4 sm:p-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[13px] font-semibold tracking-[0.14em] uppercase text-[var(--ink-mute)]">X</p>
						{visibleHandle ? (
							<>
								<p className="mt-2 text-base text-[var(--ink)]">@{visibleHandle}</p>
								<p className="mt-1 text-[13px] text-[var(--ink-dim)]">Connected</p>
							</>
						) : (
							<>
								<p className="mt-2 text-base text-[var(--ink)]">Not connected</p>
								<p className="mt-1 max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">Connect X to display your X account on your public Ape profile.</p>
							</>
						)}
					</div>
					{visibleHandle ? (
						<a href={`https://x.com/${visibleHandle}`} target="_blank" rel="noopener noreferrer" className="aoa-home-cta aoa-home-cta-ghost">View X profile</a>
					) : (
						<button type="button" onClick={onLinkX} className="aoa-home-cta aoa-home-cta-solid">Link X</button>
					)}
				</div>
				<div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
					<div className="min-w-0">
						<p className="text-[15px] text-[var(--ink)]">Show on public profile</p>
						<p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-mute)]">
							{handle ? 'Turning this off only hides X from your public profile. It does not unlink your X account.' : 'Link X before enabling public visibility.'}
						</p>
					</div>
					<SettingsToggle checked={Boolean(handle) && showX} disabled={!handle || saving} label="Show X on public profile" onChange={(next) => { void save(next, wallets); }} />
				</div>
				{xError ? <p className="mt-3 text-sm text-red-300">{xError}</p> : null}
			</div>

			<div className="mt-8">
				<h3 className="font-[family-name:var(--font-signal-display)] text-xl uppercase leading-none">Public wallets</h3>
				<p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--ink-dim)]">Choose which wallets visitors can open on OpenSea. Only wallets you enable here are shown publicly. AOA can still use your other linked wallets privately to count Apes you hold.</p>
				<ul className="mt-4 space-y-3">
					{wallets.map((wallet, index) => (
						<li key={wallet.address} className="border border-white/10 bg-black/30 p-4">
							<p className="text-base font-semibold text-[var(--ink)]">{wallet.alias || (index === 0 ? 'Main wallet' : 'Wallet')}</p>
							<p className="mt-1 font-mono text-[13px] text-[var(--ink-mute)]">{shortAddress(wallet.address)}</p>
							<a href={`https://opensea.io/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[13px] text-[var(--signal)]">Open on OpenSea</a>
							<div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
								<p className="min-w-0 text-[15px] text-[var(--ink)]">Show publicly</p>
								<SettingsToggle
									checked={wallet.isPublic}
									disabled={saving}
									label={`Show ${wallet.alias || shortAddress(wallet.address)} on OpenSea`}
									onChange={(next) => {
										const updated = wallets.map((item) => item.address === wallet.address ? { ...item, isPublic: next } : item);
										void save(showX, updated);
									}}
								/>
							</div>
						</li>
					))}
				</ul>
				{wallets.length === 0 ? <p className="mt-3 text-[14px] text-[var(--ink-mute)]">No wallets are available to show yet.</p> : null}
			</div>
			{notice ? <p className="mt-4 text-[14px] text-[var(--ink)]" role="status">{notice}</p> : null}
			{message ? <p className="mt-3 text-sm text-red-300">{message}</p> : null}
		</div>
	);
}
