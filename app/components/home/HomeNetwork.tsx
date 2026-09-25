import Link from 'next/link';
import SectionMarker from '@/app/components/signal/SectionMarker';

const CHANNELS = [
  {
    n: '01',
    title: 'AOA Records',
    href: '/music',
    note: 'Releases, artists, and the station deck.',
    mark: 'REC',
    span: 'md:col-span-4',
  },
  {
    n: '02',
    title: 'Creator Studio',
    href: '/studio',
    note: 'Visual work published from the studio.',
    mark: 'STU',
    span: 'md:col-span-2',
  },
  {
    n: '03',
    title: 'Wardrobe',
    href: '/wardrobe',
    note: 'Dress the ape.',
    mark: 'WRD',
    span: 'md:col-span-2',
  },
  {
    n: '04',
    title: 'Arcade',
    href: '/arcade',
    note: 'Browser games. Scores stay on the board.',
    mark: 'PLY',
    span: 'md:col-span-4',
  },
  {
    n: '05',
    title: 'Creative Tools',
    href: '/creative',
    note: 'The tools already on the site.',
    mark: 'TLS',
    span: 'md:col-span-3',
  },
  {
    n: '06',
    title: 'The Story',
    href: '/story',
    note: 'The full transmission.',
    mark: 'DOC',
    span: 'md:col-span-3',
  },
] as const;

export default function HomeNetwork() {
  return (
    <section className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <SectionMarker index="05" title="The Network" />
        <p className="aoa-meta mt-3">Six channels. Same station.</p>
        <ul className="mt-8 grid gap-3 md:grid-cols-6">
          {CHANNELS.map((channel) => (
            <li key={channel.href} className={`min-w-0 ${channel.span}`}>
              <Link
                href={channel.href}
                className="flex h-full min-h-[9.5rem] flex-col justify-between overflow-hidden border border-[rgba(243,238,228,0.12)] bg-[var(--background-card)] p-5 hover:border-[rgba(0,84,250,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="aoa-meta text-[var(--signal)]">Channel {channel.n}</span>
                  <span
                    className="font-black leading-none text-[var(--ink)]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: channel.n === '01' || channel.n === '04' ? 'clamp(2.5rem, 6vw, 4.5rem)' : '2rem',
                      opacity: 0.9,
                    }}
                    aria-hidden="true"
                  >
                    {channel.mark}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold uppercase tracking-wide text-[var(--ink)]">
                    {channel.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{channel.note}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="aoa-meta mt-6">
          <a
            href="https://apechain.com/apps/otherside"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ink)] hover:text-[var(--signal)]"
          >
            Otherside
          </a>
          <span className="text-[var(--ink-mute)]"> — external, on ApeChain.</span>
        </p>
      </div>
    </section>
  );
}
