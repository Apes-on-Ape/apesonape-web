import Link from 'next/link';

type OpenSeaLink = { alias: string | null; address: string; url: string };

export type PublicLinks = {
	x: { handle: string; url: string } | null;
	opensea: OpenSeaLink[];
	studio: string | null;
	artist: { name: string; url: string } | null;
};

function shortAddress(address: string) {
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function PublicProfileLinks({ links, name }: { links: PublicLinks; name: string }) {
	const items = [
		links.x ? { label: 'X', href: links.x.url, external: true, text: 'X ↗', aria: `View ${name} on X` } : null,
		...links.opensea.map((wallet) => ({
			label: wallet.alias || shortAddress(wallet.address),
			href: wallet.url,
			external: true,
			text: `${wallet.alias || 'OpenSea'} ↗`,
			aria: `View ${wallet.alias || 'wallet'} on OpenSea`,
		})),
		links.studio ? { label: 'Studio', href: links.studio, external: false, text: 'Studio', aria: `View ${name} in Studio` } : null,
		links.artist ? { label: 'AOA Records', href: links.artist.url, external: false, text: 'AOA Records', aria: `View ${name} on AOA Records` } : null,
	].filter((item): item is { label: string; href: string; external: boolean; text: string; aria: string } => !!item);

	if (!items.length) return null;

	return (
		<nav className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Public links">
			{items.map((item) => item.external ? (
				<a key={item.href + item.text} href={item.href} target="_blank" rel="noopener noreferrer" className="aoa-meta text-[var(--ink)]" aria-label={item.aria}>
					{item.text}
				</a>
			) : (
				<Link key={item.href} href={item.href} className="aoa-meta text-[var(--ink)]" aria-label={item.aria}>
					{item.text}
				</Link>
			))}
		</nav>
	);
}
