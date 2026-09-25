'use client';

import { useEffect, useState } from 'react';

type Row = {
	address: string;
	shortAddress: string;
	maskedDid: string | null;
	hasX: boolean;
	xUsername: string | null;
	sameUser: boolean;
	separateIdentity: boolean;
};

export default function PrivyLinkCheck({
	addresses,
	getAccessToken,
}: {
	addresses: string[];
	getAccessToken?: () => Promise<string | null>;
}) {
	const [rows, setRows] = useState<Row[]>([]);
	const [currentDid, setCurrentDid] = useState('');
	const [conflict, setConflict] = useState(false);
	const [otherX, setOtherX] = useState<{ handle: string | null; shortAddress: string } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const token = await getAccessToken?.();
			if (!token) return;
			const wallets = addresses.filter((address) => /^0x[a-f0-9]{40}$/i.test(address)).slice(0, 8).join(',');
			const response = await fetch(`/api/profile/privy-link-audit?wallets=${encodeURIComponent(wallets)}`, {
				headers: { Authorization: `Bearer ${token}` },
				cache: 'no-store',
			});
			const json = await response.json().catch(() => ({}));
			if (cancelled) return;
			if (!response.ok) {
				setError(typeof json.error === 'string' ? json.error : 'Could not check linked accounts.');
				return;
			}
			setCurrentDid(String(json.currentPrivyDidMasked || ''));
			setConflict(Boolean(json.conflict));
			setOtherX(json.xOnOtherIdentity ?? null);
			setRows(Array.isArray(json.wallets) ? json.wallets : []);
		})();
		return () => {
			cancelled = true;
		};
	}, [addresses, getAccessToken]);

	if (!currentDid && !error) return null;

	return (
		<div className="mt-6">
			{conflict ? (
				<div className="border border-[var(--signal)]/50 bg-black/40 p-4">
					<p className="text-[13px] font-semibold tracking-[0.14em] uppercase text-[var(--signal)]">X account linking issue</p>
					<p className="mt-2 text-[14px] leading-relaxed text-[var(--ink)]">
						Your X account appears to be connected to another account identity
						{otherX?.handle ? ` (@${otherX.handle} on ${otherX.shortAddress})` : ''}.
						Nothing was unlinked.
					</p>
				</div>
			) : null}
			<button type="button" className="aoa-meta mt-4 text-[var(--ink)]" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
				{open ? 'Hide details' : 'Show details'}
			</button>
			{open ? (
				<div className="mt-3 border border-white/10 bg-black/30 p-4 text-[14px] leading-relaxed">
					<p className="text-[var(--ink-mute)]">Current authentication identity</p>
					<p className="mt-1 font-mono text-[13px] text-[var(--ink)]">{currentDid}</p>
					{error ? <p className="mt-3 text-red-300">{error}</p> : null}
					<ul className="mt-4 space-y-3">
						{rows.map((row) => (
							<li key={row.address}>
								<p className="font-mono text-[13px] text-[var(--ink)]">{row.shortAddress}</p>
								<p className="text-[var(--ink-dim)]">
									{row.separateIdentity ? 'Another profile' : row.sameUser ? 'This profile' : 'Not tied to a saved profile'}
									{row.maskedDid && row.separateIdentity ? ` · ${row.maskedDid}` : ''}
									{row.hasX ? ` · @${row.xUsername}` : ''}
								</p>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
