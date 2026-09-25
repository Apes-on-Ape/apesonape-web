import Link from 'next/link';
import SectionMarker from '@/app/components/signal/SectionMarker';
import { getArtist } from '@/app/data/artists';
import { apeThumb } from './apes';

/** Curated from app/data/artists.ts. Portraits are the repo files or a real ape thumb. */
const COMMUNITY_SLUGS = [
  'smokethatdank1',
  'apeprofessore',
  '2real2x',
  'alexnotime',
  'rabidartwork',
  'dudeman22',
  'apevault',
  'nikos-ape',
] as const;

export default function HomeCommunity() {
  const people = COMMUNITY_SLUGS.map((slug) => getArtist(slug)).filter((artist) => artist != null);

  return (
    <section className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <SectionMarker index="06" title="The apes are the signal" />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {people.map((artist) => {
            const portrait = artist.apeId ? apeThumb(artist.apeId) : artist.avatar;
            return (
              <li key={artist.slug} className="min-w-0">
                <Link
                  href={`/artist/${artist.slug}`}
                  className="block h-full border border-[rgba(243,238,228,0.12)] bg-[var(--background-card)] hover:border-[rgba(0,84,250,0.45)]"
                >
                  <div className="aspect-square bg-[var(--background-elevated)]">
                    {portrait ? (
                      <img
                        src={portrait}
                        alt=""
                        width={480}
                        height={480}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="px-3 py-3">
                    <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{artist.name}</h3>
                    <p className="aoa-meta mt-1 truncate">{artist.role}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
