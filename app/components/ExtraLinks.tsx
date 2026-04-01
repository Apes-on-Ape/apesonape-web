'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlyph, useGlyphTokenGate } from '@use-glyph/sdk-react';
import { ChevronDown, Vote, ImageIcon, Gamepad2, Wrench, Wand2, Crown, Palette } from 'lucide-react';

export default function ExtraLinks() {
	const glyph = (useGlyph() as unknown) as {
		user?: unknown;
		address?: string;
		isAuthenticated?: boolean;
	};
	const isSignedIn = !!(glyph && ((glyph.user) || (glyph.address) || (glyph.isAuthenticated)));
	const { checkTokenGate } = useGlyphTokenGate();
	const [hasAccess, setHasAccess] = useState(false);
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!isSignedIn) { setHasAccess(false); return; }
			const chainId = 33139;
			const res = await checkTokenGate({
				contractAddress: '0xa6babe18f2318d2880dd7da3126c19536048f8b0',
				includeDelegates: true,
				...(chainId ? { chainId } : {}),
			});
			if (!cancelled) setHasAccess(!!res?.result);
		})();
		return () => { cancelled = true; };
	}, [isSignedIn, checkTokenGate]);

	// Close on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const pathname = usePathname();
	const isActive = (href: string) => pathname?.startsWith(href);

	const communityLinks = [
		{ href: '/rarity',   icon: Crown,     label: 'Rarity',          desc: 'Explore rarity rankings' },
		{ href: '/gallery',  icon: ImageIcon, label: 'Gallery',         desc: 'Community creations' },
		{ href: '/vote',     icon: Vote,      label: 'Vote',            desc: 'Community governance' },
	];

	const holderLinks = hasAccess ? [
		{ href: '/studio',                   icon: Wand2,    label: 'Studio',          desc: 'AI music & creation' },
		{ href: '/creative/ape-builder',     icon: Palette,  label: 'Ape Builder',     desc: 'Build with your traits' },
		{ href: '/creative',                 icon: Wrench,   label: 'Creative Tools',  desc: 'PFP, banners, QR' },
		{ href: '/arcade', icon: Gamepad2, label: 'Arcade',        desc: 'Holder-only games', external: false },
	] : [];

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen(o => !o)}
				className="flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:text-hero-blue"
				style={{ color: open ? 'var(--hero-blue)' : 'rgba(245,245,245,1)' }}
			>
				More
				<ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.97 }}
						transition={{ duration: 0.18 }}
						className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-white/15 shadow-2xl shadow-black/50 overflow-hidden z-50"
						style={{ background: 'rgba(8,8,20,0.97)', backdropFilter: 'blur(20px)' }}
					>
						{/* Community section */}
						<div className="px-3 pt-3 pb-1">
							<div className="text-[10px] uppercase tracking-widest text-white/25 font-bold px-2 mb-1">Community</div>
							{communityLinks.map(({ href, icon: Icon, label, desc }) => (
								<Link
									key={href}
									href={href}
									onClick={() => setOpen(false)}
									className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-hero-blue/10 group
										${isActive(href) ? 'bg-hero-blue/10 text-hero-blue' : 'text-white/70 hover:text-white'}`}
								>
									<div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
										${isActive(href) ? 'bg-hero-blue/20' : 'bg-white/5 group-hover:bg-hero-blue/15'}`}>
										<Icon className={`w-3.5 h-3.5 ${isActive(href) ? 'text-hero-blue' : 'text-white/50 group-hover:text-hero-blue'}`} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium leading-tight">{label}</div>
										<div className="text-[11px] text-white/35 mt-0.5">{desc}</div>
									</div>
								</Link>
							))}
						</div>

						{/* Holder section */}
						{holderLinks.length > 0 && (
							<div className="px-3 pb-3 border-t border-white/8 mt-2 pt-2">
								<div className="text-[10px] uppercase tracking-widest text-hero-blue/50 font-bold px-2 mb-1">Holder Perks</div>
								{holderLinks.map(({ href, icon: Icon, label, desc, external }) => (
									external ? (
										<a
											key={href}
											href={href}
											target="_blank"
											rel="noopener noreferrer"
											onClick={() => setOpen(false)}
											className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-hero-blue/10 group text-white/70 hover:text-white"
										>
											<div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5 group-hover:bg-hero-blue/15 transition-colors">
												<Icon className="w-3.5 h-3.5 text-white/50 group-hover:text-hero-blue" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium leading-tight">{label}</div>
												<div className="text-[11px] text-white/35 mt-0.5">{desc}</div>
											</div>
										</a>
									) : (
										<Link
											key={href}
											href={href}
											onClick={() => setOpen(false)}
											className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-hero-blue/10 group
												${isActive(href) ? 'bg-hero-blue/10 text-hero-blue' : 'text-white/70 hover:text-white'}`}
										>
											<div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
												${isActive(href) ? 'bg-hero-blue/20' : 'bg-white/5 group-hover:bg-hero-blue/15'}`}>
												<Icon className={`w-3.5 h-3.5 ${isActive(href) ? 'text-hero-blue' : 'text-white/50 group-hover:text-hero-blue'}`} />
											</div>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium leading-tight">{label}</div>
												<div className="text-[11px] text-white/35 mt-0.5">{desc}</div>
											</div>
										</Link>
									)
								))}
							</div>
						)}

						{!hasAccess && isSignedIn && (
							<div className="px-5 py-3 border-t border-white/8 text-[11px] text-white/25">
								Hold an Ape to unlock holder features
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
