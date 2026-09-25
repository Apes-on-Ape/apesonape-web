'use client';

import { useEffect, useState } from 'react';
import TransmissionCard from '@/app/components/signal/TransmissionCard';
import { ARCADE_LEADERBOARD_GAMES } from '@/app/arcade/arcade-games';

type Card = {
  key: string;
  kicker: string;
  title: string;
  body?: string;
  meta?: string;
  href?: string;
};

const ARCADE_GAME_ID = 'ape_man';

function formatWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default function HomeSignalLive() {
  const [cards, setCards] = useState<Card[]>([]);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next: Card[] = [];

      try {
        const response = await fetch('/api/soundcloud/latest-playlist');
        if (response.ok) {
          const data = (await response.json()) as {
            title?: string;
            url?: string;
            trackCount?: number;
          };
          const title = data.title?.trim();
          if (title) {
            const count = typeof data.trackCount === 'number' ? data.trackCount : 0;
            next.push({
              key: 'release',
              kicker: 'AOA Records',
              title,
              body: 'Latest release on the station.',
              meta: count > 0 ? `${count} tracks` : undefined,
              href: '/music',
            });
          }
        }
      } catch {
        /* skip this source */
      }

      try {
        const response = await fetch('/api/studio/creations/?type=visual&limit=2');
        if (response.ok) {
          const data = (await response.json()) as {
            items?: Array<{ id?: string; title?: string; createdAt?: string; description?: string }>;
          };
          for (const item of data.items ?? []) {
            const title = item.title?.trim();
            const id = item.id?.trim();
            if (!title || !id) continue;
            const when = formatWhen(item.createdAt);
            const description = item.description?.trim();
            next.push({
              key: `studio-${id}`,
              kicker: 'Studio',
              title,
              body: description ? description.slice(0, 140) : 'Visual transmission from the studio.',
              meta: when ?? undefined,
              href: `/studio/${id}`,
            });
          }
        }
      } catch {
        /* skip this source */
      }

      try {
        const game = ARCADE_LEADERBOARD_GAMES.find((entry) => entry.gameId === ARCADE_GAME_ID);
        const response = await fetch(
          `/api/arcade/leaderboard?mode=game&gameId=${ARCADE_GAME_ID}&limit=1`,
        );
        if (response.ok && game) {
          const data = (await response.json()) as {
            rows?: Array<{
              score?: number;
              created_at?: string;
              display_name?: string | null;
            }>;
          };
          const row = data.rows?.[0];
          const score = typeof row?.score === 'number' ? row.score : 0;
          if (row && score > 0) {
            const when = formatWhen(row.created_at);
            const name = row.display_name?.trim();
            const parts = [`High score ${score.toLocaleString('en-US')}`];
            if (when) parts.push(when);
            next.push({
              key: 'arcade',
              kicker: 'Arcade',
              title: game.title,
              body: name ? `${name} holds the board.` : 'Top score on the board.',
              meta: parts.join(' · '),
              href: '/arcade/leaderboard',
            });
          }
        }
      } catch {
        /* skip this source */
      }

      if (!cancelled) {
        setCards(next);
        setPending(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {pending ? (
        <p className="aoa-meta md:col-span-2">Checking the station.</p>
      ) : null}
      {cards.map((card) => (
        <TransmissionCard
          key={card.key}
          kicker={card.kicker}
          title={card.title}
          body={card.body}
          meta={card.meta}
          href={card.href}
        />
      ))}
    </>
  );
}
