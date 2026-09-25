import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArcadeGameFrame from '../ArcadeGameFrame';
import ArcadePlayerStatus from '../ArcadePlayerStatus';
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
    <section className="pb-[calc(var(--aoa-dock-offset)+0.75rem)] pt-[calc(var(--aoa-header-h)+0.75rem)]">
      <div className="container-premium">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <ArcadePlayerStatus />
            <h1 className="arcade-title-pixel mt-2 text-lg sm:text-2xl">{selected.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/arcade" className="arcade-btn-ghost">Arcade</Link>
            <Link href={`/arcade/leaderboard?mode=game&game=${selected.slug}`} className="arcade-btn-ghost">High scores</Link>
          </div>
        </div>
        <div className="arcade-screen-frame">
          <ArcadeGameFrame title={selected.title} src={selected.path} />
        </div>
      </div>
    </section>
  );
}
