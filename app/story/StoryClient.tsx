import Link from 'next/link';
import type { ReactNode } from 'react';
import { CONTRACT_APESCAN, SOCIALS } from '@/app/data/site';
import { getArtist } from '@/app/data/artists';
import BroadcastLabel from '@/app/components/signal/BroadcastLabel';
import SectionMarker from '@/app/components/signal/SectionMarker';
import NoiseOverlay from '@/app/components/signal/NoiseOverlay';
import { CURRENT_ART, ORIGINAL_ART, STORY_FAQS, storyEntry } from './record';

const discord = SOCIALS.find((item) => item.platform === 'discord');

const NEXT_ROUTES = [
  { href: '/music', label: 'Listen', note: 'AOA Records' },
  { href: '/collection', label: 'Explore the apes', note: '10,000' },
  { href: '/studio', label: 'Create', note: 'Studio' },
  { href: '/arcade', label: 'Play', note: 'Arcade' },
  { href: '/wardrobe', label: 'Wardrobe', note: 'Dress the ape' },
  { href: '/creative', label: 'Tools', note: 'Creative' },
] as const;

function Chapter({
  index,
  title,
  date,
  children,
}: {
  index: string;
  title: string;
  date?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium py-14 md:py-20">
        <SectionMarker index={index} title={title} />
        {date ? <p className="type-section mt-6 text-[var(--signal)]">{date}</p> : null}
        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-[var(--ink-dim)]">{children}</div>
      </div>
    </section>
  );
}

export default function StoryClient() {
  const bayc = storyEntry('BAYC Goes Live');
  const apecoin = storyEntry('ApeCoin Launches');
  const chain = storyEntry('ApeChain Launches');
  const launch = storyEntry('Apes on Ape Launches');
  const dmca = storyEntry('The DMCA');
  const rebirth = storyEntry('The Rebirth');
  const ath = storyEntry('All-Time High');
  const artTeam = storyEntry('New Art Team');
  const delivery = storyEntry('New Art Delivered');
  const today = storyEntry('Creative Powerhouse');
  const mint = STORY_FAQS.find((item) => item.q === 'When did AOA mint?');
  const smoke = getArtist('smokethatdank1');
  const professore = getArtist('apeprofessore');

  return (
    <div className="overflow-x-clip text-[var(--ink)]">
      <header className="relative min-h-[100dvh] overflow-hidden">
        <NoiseOverlay />
        <div className="container-premium relative z-10 flex min-h-[100dvh] flex-col justify-end pb-[calc(var(--aoa-dock-offset)+1.5rem)] pt-[calc(var(--aoa-header-h)+2rem)]">
          <BroadcastLabel>Case file</BroadcastLabel>
          <h1 className="type-hero-home mt-6 max-w-[14ch] text-[var(--ink)]">
            Born from chaos.
            <br />
            Built for culture.
          </h1>
          <p className="mt-6 max-w-md text-lg text-[var(--ink)]">A collection that had to rebuild itself.</p>
          <p className="aoa-meta mt-8">ApeChain // 33139</p>
        </div>
      </header>

      <Chapter index="01" title="Genesis" date={launch.date}>
        <p className="text-[var(--ink)]">{launch.body}</p>
        <p>{chain.body}</p>
        <div className="grid gap-3 pt-4 sm:grid-cols-2">
          {[bayc, apecoin].map((item) => (
            <article key={item.title} className="border border-[rgba(243,238,228,0.12)] p-4">
              <p className="aoa-meta text-[var(--signal)]">{item.date}</p>
              <h3 className="mt-2 font-semibold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-2 text-sm">{item.body}</p>
            </article>
          ))}
        </div>
      </Chapter>

      <section className="border-t border-[rgba(243,238,228,0.12)] bg-[var(--background-elevated)]">
        <div className="container-premium py-16 md:py-24">
          <p className="aoa-meta text-[var(--signal)]">02 // Takedown</p>
          <p className="type-hero-home mt-4 max-w-[12ch] text-[var(--ink)]">{dmca.date}</p>
          <h2 className="type-section mt-6 text-[var(--ink)]">{dmca.title}</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-dim)]">{dmca.body}</p>
        </div>
      </section>

      <Chapter index="03" title="The rebuild" date={rebirth.date}>
        <p className="text-[var(--ink)]">{rebirth.body}</p>
        {mint ? <p>{mint.a}</p> : null}
      </Chapter>

      <section className="border-t border-[rgba(243,238,228,0.12)]">
        <div className="container-premium py-10">
          <article className="max-w-xl border border-[rgba(243,238,228,0.12)] p-5">
            <p className="aoa-meta">Record · {ath.date}</p>
            <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">{ath.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">{ath.body}</p>
          </article>
        </div>
      </section>

      <section className="border-t border-[rgba(243,238,228,0.12)]">
        <div className="container-premium py-14 md:py-20">
          <SectionMarker index="04" title="New art" />
          <p className="aoa-meta mt-4">{artTeam.date}</p>
          <p className="mt-6 max-w-3xl leading-relaxed text-[var(--ink-dim)]">{artTeam.body}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[smoke, professore].map((artist) =>
              artist ? (
                <Link
                  key={artist.slug}
                  href={`/artist/${artist.slug}`}
                  className="border border-[rgba(243,238,228,0.12)] p-4 hover:border-[rgba(0,84,250,0.45)]"
                >
                  <p className="font-semibold text-[var(--ink)]">{artist.name}</p>
                  <p className="aoa-meta mt-1">{artist.role}</p>
                </Link>
              ) : null,
            )}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <figure>
              <img
                src={ORIGINAL_ART}
                alt="Original Apes on Ape art, file aoa-original-7650"
                width={800}
                height={800}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <figcaption className="aoa-meta mt-3">
                Original art on file · Ape 7650
              </figcaption>
            </figure>
            <figure>
              <img
                src={CURRENT_ART}
                alt="Current collection thumbnail for Ape 7650"
                width={800}
                height={800}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <figcaption className="aoa-meta mt-3">
                Current collection thumbnail · Ape 7650
              </figcaption>
            </figure>
          </div>
          <p className="aoa-meta mt-4 max-w-2xl">
            Same token number. The left file is the original art kept in the site archive. The right image is the live collection thumbnail.
          </p>
          <Link href="/collection/7650" className="aoa-meta mt-4 inline-block text-[var(--signal)]">
            Open Ape 7650
          </Link>
        </div>
      </section>

      <Chapter index="05" title="Delivery" date={delivery.date}>
        <p className="text-[var(--ink)]">{delivery.body}</p>
      </Chapter>

      <Chapter index="06" title="AOA Records" date="December 2025">
        <p>
          The December 2025 delivery is when apesonape.io goes live with SoundCloud. NoTime, 2Real2x, SmokeThatDank, and ApeProfessore are releasing music.
        </p>
        <Link href="/music" className="aoa-home-cta aoa-home-cta-solid mt-4 inline-flex">
          Enter AOA Records
        </Link>
      </Chapter>

      <section className="border-t border-[rgba(243,238,228,0.12)]">
        <div className="container-premium py-14 md:py-20">
          <SectionMarker index="07" title="The signal" />
          <p className="mt-6 max-w-2xl text-[var(--ink-dim)]">{today.body}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NEXT_ROUTES.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className="flex min-h-[5.5rem] flex-col justify-between border border-[rgba(243,238,228,0.12)] p-4 hover:border-[rgba(0,84,250,0.45)]"
                >
                  <span className="aoa-meta text-[var(--signal)]">{route.note}</span>
                  <span className="mt-3 text-lg font-semibold uppercase tracking-wide text-[var(--ink)]">{route.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[rgba(243,238,228,0.12)]">
        <div className="container-premium py-16 md:py-24">
          <p className="aoa-meta">08 // Today</p>
          <h2 className="type-hero-home mt-4 max-w-[12ch] text-[var(--ink)]">
            The story
            <br />
            is still being written.
          </h2>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            <Link href="/music" className="aoa-home-cta aoa-home-cta-solid w-full min-[420px]:w-auto">Listen</Link>
            <Link href="/collection" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">Explore the apes</Link>
            <Link href="/studio" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">Create</Link>
            <Link href="/arcade" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">Play</Link>
            <Link href="/join" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">Join</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(243,238,228,0.12)]">
        <div className="container-premium py-14 md:py-20">
          <SectionMarker title="Archive notes" />
          <dl className="mt-8 max-w-3xl space-y-6">
            {STORY_FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="font-semibold text-[var(--ink)]">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{faq.a}</dd>
              </div>
            ))}
          </dl>
          <p className="aoa-meta mt-8 flex flex-wrap gap-x-4 gap-y-2">
            <a href={CONTRACT_APESCAN} target="_blank" rel="noreferrer" className="text-[var(--ink)]">ApeScan ↗</a>
            <a href="https://opensea.io/collection/apes-on-apechain" target="_blank" rel="noreferrer" className="text-[var(--ink)]">OpenSea ↗</a>
            <a href="https://apechain.com" target="_blank" rel="noreferrer" className="text-[var(--ink)]">apechain.com ↗</a>
            <a href="https://apecoin.com" target="_blank" rel="noreferrer" className="text-[var(--ink)]">apecoin.com ↗</a>
            <a href="https://apechain.com/apps/otherside" target="_blank" rel="noreferrer" className="text-[var(--ink)]">Otherside ↗</a>
            {discord ? (
              <a href={discord.href} target="_blank" rel="noreferrer" className="text-[var(--ink)]">Discord ↗</a>
            ) : null}
          </p>
        </div>
      </section>
    </div>
  );
}
