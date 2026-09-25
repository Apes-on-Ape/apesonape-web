'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Footer from '@/app/components/Footer';
import ProfileFrame from '@/app/components/profile/ProfileFrame';
import ProfileIdentity from '@/app/components/profile/ProfileIdentity';
import ProfileRecord from '@/app/components/profile/ProfileRecord';
import ProfileTabs, { type ProfileTab } from '@/app/components/profile/ProfileTabs';
import ProfileApeGrid from '@/app/components/profile/ProfileApeGrid';
import ProfileTransmissions from '@/app/components/profile/ProfileTransmissions';
import ArcadeRecord from '@/app/components/profile/ArcadeRecord';
import PublicProfileLinks, { type PublicLinks } from '@/app/components/profile/PublicProfileLinks';
import { CreationRecord } from '@/lib/studio/types';

export default function ProfileByUsernamePage({ params }: { params: Promise<{ username: string }> }) {
	const { username } = use(params);
	const router = useRouter();
	const privy = (usePrivy() as unknown) as { user?: { twitter?: { username?: string } } };
	const loggedHandle = (privy?.user?.twitter?.username || '').toLowerCase();
	const isSelf = loggedHandle && loggedHandle === username.toLowerCase();
	const [tab, setTab] = useState<ProfileTab>('apes');
	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [portraitApe, setPortraitApe] = useState<number | null>(null);
	const [headline, setHeadline] = useState(username);
	const [apeCount, setApeCount] = useState<number | null>(null);
	const [tokenIds, setTokenIds] = useState<number[] | null>(null);
	const [links, setLinks] = useState<PublicLinks | null>(null);

	useEffect(() => {
		if (isSelf) router.replace('/profile/');
	}, [isSelf, router]);

	useEffect(() => {
		const tab = new URLSearchParams(window.location.search).get('tab');
		if (tab === 'apes' || tab === 'creations' || tab === 'arcade') setTab(tab);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const [profileRes, studioRes] = await Promise.all([
					fetch(`/api/profile/public?username=${encodeURIComponent(username)}`, { cache: 'no-store' }),
					fetch(`/api/studio/creations/?creator=${encodeURIComponent(username)}&limit=50&type=visual`, { cache: 'no-store' }),
				]);
				const profileJson = await profileRes.json().catch(() => ({}));
				if (!profileRes.ok) throw new Error(profileJson?.error || 'Ape not found.');
				if (cancelled) return;
				setHeadline(String(profileJson.displayName || username));
				setForeverApe(typeof profileJson.foreverApe === 'number' ? profileJson.foreverApe : null);
				setPortraitApe(typeof profileJson.avatarToken === 'number' ? profileJson.avatarToken : null);
				setApeCount(typeof profileJson.apeCount === 'number' ? profileJson.apeCount : null);
				setTokenIds(Array.isArray(profileJson.tokenIds) ? profileJson.tokenIds : []);
				setLinks(profileJson.publicLinks ?? null);
				const studioJson = await studioRes.json().catch(() => ({ items: [] }));
				setCreations((studioJson.items || []) as CreationRecord[]);
			} catch (err: unknown) {
				if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [username]);

	const showForeverLine = foreverApe != null && headline !== `#${foreverApe}`;
	const publicLinks: PublicLinks = {
		x: links?.x ?? null,
		opensea: links?.opensea ?? [],
		studio: links?.studio || (creations.length ? `/studio/creator/${encodeURIComponent(username)}/` : null),
		artist: links?.artist ?? null,
	};

	return (
		<div className="min-h-screen text-[var(--ink)]">
		<ProfileFrame>
			{error ? (
				<div>
					<p className="aoa-meta text-[var(--signal)]">Ape record</p>
					<h1 className="mt-4 font-[family-name:var(--font-signal-display)] text-4xl font-bold uppercase sm:text-6xl">Ape not found.</h1>
					<p className="mt-4 text-sm text-[var(--ink-mute)]">{error}</p>
					<Link href="/profile" className="aoa-meta mt-8 inline-block text-[var(--ink)]">Your profile</Link>
				</div>
			) : (
				<>
					<ProfileIdentity
						headline={headline}
						foreverApe={foreverApe}
						portraitApe={portraitApe}
						foreverLine={showForeverLine ? `Forever Ape // #${foreverApe}` : undefined}
						meta={apeCount != null ? <p className="aoa-meta">Apes owned {apeCount}</p> : null}
						actions={<PublicProfileLinks links={publicLinks} name={headline} />}
					/>
					<ProfileRecord username={username} />
					<ProfileTabs value={tab} onChange={setTab} apesLabel="Apes" />
					<div className={tab === 'apes' ? 'block' : 'hidden'}>
						{tokenIds ? (
							<ProfileApeGrid walletAddresses={[]} tokenIds={tokenIds} heading="Apes" />
						) : (
							<p className="mt-8 text-sm text-[var(--ink-mute)]">{loading ? 'Loading.' : 'No public Apes on this record.'}</p>
						)}
					</div>
					{tab === 'creations' ? (
						<ProfileTransmissions items={creations} loadingItems={loading} />
					) : null}
					{tab === 'arcade' && publicLinks.opensea.length ? (
						<ArcadeRecord addresses={publicLinks.opensea.map((wallet) => wallet.address)} />
					) : null}
					{tab === 'arcade' && !publicLinks.opensea.length ? (
						<p className="mt-8 text-sm text-[var(--ink-mute)]">No public arcade record on this profile.</p>
					) : null}
				</>
			)}
		</ProfileFrame>
		<Footer />
		</div>
	);
}
