'use client';

import Link from 'next/link';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
import { Award, ChevronLeft } from 'lucide-react';
import { ArcadeAchievementsPanel } from '@/app/components/ArcadeAchievementsPanel';

export default function ArcadeAchievementsPage() {
  const { addresses: walletAddresses } = useSessionWallets();

  const hasWallets = walletAddresses.length > 0;

  return (
    <section className="section-spacing pt-24 md:pt-32">
      <div className="container-premium">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="arcade-subline mb-2">/// ACHIEVEMENTS ///</p>
            <h1 className="arcade-title-pixel flex items-center gap-3 text-xl sm:text-2xl md:text-3xl">
              <Award className="h-8 w-8 shrink-0 text-[var(--arcade-amber)]" aria-hidden />
              Arcade achievements
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-sub)]">
              Unlock badges as you play, stack points, and flex on the jungle floor. Progress is tied to your linked
              holder wallet(s).
            </p>
          </div>
          <Link href="/arcade" className="arcade-btn-ghost inline-flex items-center gap-2 self-start">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            LOBBY
          </Link>
        </div>

        {hasWallets ? (
          <ArcadeAchievementsPanel addresses={walletAddresses} variant="profile" />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-12 text-center text-sm text-[var(--text-sub)]">
            <p className="mb-4 font-semibold text-zinc-300">Sign in to see your achievements</p>
            <p className="text-xs text-zinc-500">
              Your arcade progress is saved per wallet once you&apos;re verified as a holder.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
