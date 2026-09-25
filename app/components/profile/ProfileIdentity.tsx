import type { ReactNode } from 'react';
import SafeImage from '@/app/components/SafeImage';
import BrandLogo from '@/app/components/BrandLogo';

const CDN_THUMB_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

type Props = {
	headline: string;
	foreverApe: number | null;
	portraitApe?: number | null;
	shortWallet?: string;
	walletAlias?: string;
	connected?: boolean;
	foreverLine?: string;
	actions?: ReactNode;
	meta?: ReactNode;
};

export default function ProfileIdentity({
	headline,
	foreverApe,
	portraitApe,
	shortWallet,
	walletAlias,
	connected = false,
	foreverLine,
	actions,
	meta,
}: Props) {
	const portraitId = portraitApe === undefined ? foreverApe : portraitApe;
	const portrait = portraitId != null ? `${CDN_THUMB_BASE}/${portraitId}.webp` : null;

	return (
		<header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10">
			<div className="relative h-40 w-40 shrink-0 overflow-hidden border border-white/10 bg-black sm:h-52 sm:w-52">
				{portrait ? (
					<SafeImage
						src={portrait}
						alt={portraitId != null ? `Ape ${portraitId}` : ''}
						fill
						sizes="208px"
						className="object-cover"
						unoptimized
					/>
				) : (
					<BrandLogo className="h-full w-full" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-4">
					<p className="aoa-meta text-[var(--signal)]">Ape</p>
					{connected ? (
						<p className="aoa-meta inline-flex items-center gap-2">
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ink-mute)]" aria-hidden />
							Connected
						</p>
					) : null}
				</div>
				<h1 className="mt-3 break-words font-[family-name:var(--font-signal-display)] text-4xl font-bold leading-[0.9] tracking-tight text-[var(--ink)] sm:text-6xl">
					{headline}
				</h1>
				<div className="mt-4 space-y-1 text-sm text-[var(--ink-dim)]">
					{foreverLine ? <p className="font-meta text-[12px] tracking-[0.12em] uppercase">{foreverLine}</p> : null}
					{walletAlias ? <p className="text-sm text-[var(--ink-dim)]">{walletAlias}</p> : null}
					{shortWallet ? <p className="font-mono text-[13px] text-[var(--ink-mute)]">{shortWallet}</p> : null}
					{meta}
				</div>
				{actions ? <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div> : null}
			</div>
		</header>
	);
}
