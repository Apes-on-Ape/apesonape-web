import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User } from 'lucide-react';
import ArcadeGameFrame from '../ArcadeGameFrame';
import { getArcadeGame } from '../arcade-games';

type Props = {
  params: Promise<{ game: string }>;
};

export default async function ArcadeGamePage({ params }: Props) {
  const { game } = await params;
  const selected = getArcadeGame(game);

  if (!selected) {
    notFound();
  }

  return (
    <section className="section-spacing pt-24 md:pt-28">
      <div className="container-premium">
        <div className="mb-8 flex flex-col gap-4 border-b border-[rgba(0,240,255,0.18)] pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="arcade-subline mb-2">/// NOW PLAYING ///</p>
            <h1 className="arcade-title-pixel text-xl sm:text-2xl md:text-3xl">{selected.title}</h1>
            <p className="mt-3 max-w-xl text-sm text-[var(--text-sub)] md:text-base">{selected.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Link href="/arcade" className="arcade-btn-ghost">
              ← LOBBY
            </Link>
            <Link href="/profile" className="arcade-btn-ghost inline-flex items-center gap-2">
              <User className="h-3.5 w-3.5 opacity-80" aria-hidden />
              PROFILE
            </Link>
          </div>
        </div>

        <div className="arcade-screen-frame">
          <ArcadeGameFrame title={selected.title} src={selected.path} />
        </div>
      </div>
    </section>
  );
}
