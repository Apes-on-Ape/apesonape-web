import Link from 'next/link';
import SectionMarker from '@/app/components/signal/SectionMarker';

/**
 * Short teaser drawn from the documented timeline in app/story/StoryClient.tsx.
 * The June 29 2025 price chapter is intentionally left on the story page.
 */
const CHAPTERS = [
  {
    n: '01',
    title: 'Launch',
    when: 'October 2024',
    body: 'ApeChain goes live. Apes on Ape mints with it, one of the first collections on the chain. Placeholder art. The OG set.',
  },
  {
    n: '02',
    title: 'Takedown',
    when: 'December 2024',
    body: 'A DMCA takedown removes the original art. Platforms delist the project. It goes dark.',
  },
  {
    n: '03',
    title: 'Rebuild',
    when: 'Late 2024 – Early 2025',
    body: 'The community stays. The original pixels are scrapped. A new 10,000-piece collection is built from scratch.',
  },
  {
    n: '04',
    title: 'New art',
    when: 'October – December 2025',
    body: 'SmokeThatDank and ApeProfessore take the art. In December 2025 the new generative set is delivered on-chain.',
  },
  {
    n: '05',
    title: 'AOA Records',
    when: 'December 2025',
    body: 'apesonape.io opens in the same chapter: SoundCloud on the station, beside the new art.',
  },
  {
    n: '06',
    title: 'The Signal',
    when: 'Today',
    body: 'The story page calls the current chapter a creative one: artists releasing music, arcade games, wardrobe drops.',
  },
] as const;

export default function HomeRebirth() {
  return (
    <section className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <SectionMarker index="03" title="The Rebirth" />
        <p className="type-section mt-6 max-w-3xl text-[var(--ink)]">
          They took the art down.
          <br />
          The apes built again.
        </p>
        <ol className="mt-10 grid gap-px bg-[rgba(243,238,228,0.12)] sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map((chapter) => (
            <li key={chapter.n} className="bg-[var(--bg)] p-5">
              <p className="aoa-meta text-[var(--signal)]">
                {chapter.n} // {chapter.when}
              </p>
              <h3 className="mt-3 text-lg font-semibold uppercase tracking-wide text-[var(--ink)]">
                {chapter.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{chapter.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link href="/story" className="aoa-home-cta aoa-home-cta-ghost">
            Read the full transmission
          </Link>
        </div>
      </div>
    </section>
  );
}
