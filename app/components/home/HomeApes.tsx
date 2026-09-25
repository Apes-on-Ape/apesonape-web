import Link from 'next/link';
import SectionMarker from '@/app/components/signal/SectionMarker';
import { COLLECTION_SUPPLY } from '@/app/data/stats';
import { SCAN_APE_IDS, apeCode, apeThumb } from './apes';

export default function HomeApes() {
  const supply = COLLECTION_SUPPLY.toLocaleString('en-US');

  return (
    <section className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <SectionMarker index="04" title={`${supply} Apes`} />
        <p className="aoa-meta mt-3">One signal.</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SCAN_APE_IDS.map((id) => (
            <li key={id} className="min-w-0">
              <Link
                href={`/collection/${id}`}
                className="group block border border-[rgba(243,238,228,0.12)] bg-[var(--background-card)]"
              >
                <div className="aspect-square bg-[var(--background-elevated)]">
                  <img
                    src={apeThumb(id)}
                    alt={`Ape ${apeCode(id)}`}
                    width={480}
                    height={480}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <span className="aoa-meta text-[var(--ink)]">Ape // {apeCode(id)}</span>
                  <span className="aoa-meta text-[var(--signal)]">Open</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Link href="/collection" className="aoa-home-cta aoa-home-cta-solid">
            Scan all {supply}
          </Link>
        </div>
      </div>
    </section>
  );
}
