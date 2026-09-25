'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
import Footer from '../components/Footer';
import ProfileFrame from '../components/profile/ProfileFrame';
import ProfileIdentity from '../components/profile/ProfileIdentity';
import ProfileRecord from '../components/profile/ProfileRecord';
import ProfileTabs, { type ProfileTab } from '../components/profile/ProfileTabs';
import ProfileApeGrid from '../components/profile/ProfileApeGrid';
import ProfileTransmissions from '../components/profile/ProfileTransmissions';
import ArcadeRecord from '../components/profile/ArcadeRecord';

type PrivyTwitter = { name?: string; username?: string };
type PrivyUser = { id?: string; twitter?: PrivyTwitter };

export default function ProfilePage() {
	const { user, getAccessToken } = (usePrivy() as unknown) as {
		user?: PrivyUser;
		getAccessToken?: () => Promise<string | null>;
	};
	const session = useSessionWallets();
	const privyUserId = useMemo(() => user?.id?.trim() ?? '', [user?.id]);
	const twitter = user?.twitter ?? null;
	const walletAddresses = session.addresses;
	const walletAddress = walletAddresses[0] ?? '';

	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [storedName, setStoredName] = useState('');
	const [activeTab, setActiveTab] = useState<ProfileTab>('apes');
	const [streak, setStreak] = useState<number | null>(null);

	useEffect(() => {
		const tab = new URLSearchParams(window.location.search).get('tab');
		if (tab === 'apes' || tab === 'creations' || tab === 'arcade') setActiveTab(tab);
	}, []);

	useEffect(() => {
		if (!privyUserId) {
			setStreak(null);
			return;
		}
		let cancelled = false;
		fetch(`/api/profile/summary?userId=${encodeURIComponent(privyUserId)}`, { cache: 'no-store' })
			.then((response) => response.json())
			.then((json: { engagement?: { streak_current?: number }; profile?: { display_name?: string | null } }) => {
				if (cancelled) return;
				setStreak(json?.engagement?.streak_current ?? 0);
				const name = json?.profile?.display_name?.trim();
				if (name) setStoredName(name);
			})
			.catch(() => {
				if (!cancelled) setStreak(null);
			});
		return () => {
			cancelled = true;
		};
	}, [privyUserId]);

	useEffect(() => {
		if (!walletAddress && !privyUserId) return;
		let cancelled = false;
		const qs = new URLSearchParams();
		if (walletAddress) qs.set('address', walletAddress);
		if (privyUserId) qs.set('userId', privyUserId);
		fetch(`/api/profile/forever-ape?${qs.toString()}`, { cache: 'no-store' })
			.then((response) => response.json())
			.then((json) => {
				if (!cancelled) setForeverApe(typeof json.apeId === 'number' ? json.apeId : null);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [walletAddress, privyUserId]);

	useEffect(() => {
		if (!session.signedIn) return;
		let cancelled = false;
		(async () => {
			const token = await getAccessToken?.();
			if (!token) return;
			const response = await fetch('/api/profile/identity?lite=1', {
				headers: { Authorization: `Bearer ${token}` },
				cache: 'no-store',
			});
			const json = await response.json().catch(() => ({}));
			if (!response.ok || cancelled) return;
			if (typeof json.displayName === 'string' && json.displayName.trim()) setStoredName(json.displayName.trim());
			if (typeof json.foreverApeId === 'number') setForeverApe(json.foreverApeId);
		})();
		return () => {
			cancelled = true;
		};
	}, [session.signedIn, getAccessToken]);

	const headline = storedName || twitter?.name || twitter?.username || (foreverApe != null ? `#${foreverApe}` : 'Ape');
	const showForeverLine = foreverApe != null && headline !== `#${foreverApe}`;

	if (!session.signedIn) {
		return (
			<div className="min-h-screen text-[var(--ink)]">
				<ProfileFrame>
					<p className="aoa-meta text-[var(--signal)]">Ape record</p>
					<h1 className="mt-4 max-w-[16ch] font-[family-name:var(--font-signal-display)] text-4xl font-bold uppercase leading-[0.9] sm:text-6xl">
						Sign in to open your ape record.
					</h1>
					<button type="button" className="aoa-home-cta aoa-home-cta-solid mt-8" onClick={() => { void session.login?.(); }}>
						Sign in
					</button>
				</ProfileFrame>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen text-[var(--ink)]">
			<ProfileFrame>
				<ProfileIdentity
					headline={headline}
					foreverApe={foreverApe}
					connected
					foreverLine={showForeverLine ? `Forever Ape // #${foreverApe}` : undefined}
					meta={
						<>
							{storedName && twitter?.username ? <p className="aoa-meta">@{twitter.username}</p> : null}
							{streak && streak > 0 ? <p className="text-sm text-[var(--ink-mute)]">{streak} day streak</p> : null}
						</>
					}
					actions={
						<>
							{twitter?.username ? (
								<a href={`https://x.com/${twitter.username}`} target="_blank" rel="noopener noreferrer" className="aoa-meta hover:text-[var(--ink)]">X</a>
							) : null}
							<Link href="/studio/" className="aoa-meta hover:text-[var(--ink)]">Studio</Link>
							<Link href="/leaderboard/" className="aoa-meta hover:text-[var(--ink)]">Ape Board</Link>
							<Link href={foreverApe !== null ? `/wardrobe/?ape=${foreverApe}` : '/wardrobe/'} className="aoa-meta hover:text-[var(--ink)]">Wardrobe</Link>
							<Link href="/settings/profile/" className="aoa-meta text-[var(--ink)]">Settings →</Link>
						</>
					}
				/>

				{privyUserId ? <ProfileRecord userId={privyUserId} addresses={walletAddresses} /> : null}
				<ProfileTabs value={activeTab} onChange={setActiveTab} />
				<div className={activeTab === 'apes' ? 'block' : 'hidden'}>
					<ProfileApeGrid walletAddresses={walletAddresses} showCollectionLink />
				</div>
				{activeTab === 'creations' ? <ProfileTransmissions addresses={walletAddresses} canPublish /> : null}
				{activeTab === 'arcade' ? <ArcadeRecord addresses={walletAddresses} /> : null}

				<button
					type="button"
					onClick={() => { void session.logout?.(); }}
					className="mt-16 text-sm tracking-[0.16em] uppercase text-[var(--ink-mute)] hover:text-[var(--ink)]"
				>
					Sign out
				</button>
			</ProfileFrame>
			<Footer />
		</div>
	);
}
