import SectionMarker from '@/app/components/signal/SectionMarker';
import TransmissionCard from '@/app/components/signal/TransmissionCard';
import HomeSignalLive from './HomeSignalLive';
import { apeCode } from './apes';

const FEATURED_APE = 42;

export default function HomeSignal() {
  return (
    <section id="the-signal" className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <SectionMarker index="01" title="The Signal" />
        <p className="aoa-meta mt-3 max-w-xl text-[var(--ink-dim)]">
          What&apos;s moving through the network.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <TransmissionCard
            kicker="Collection"
            title={`Ape // ${apeCode(FEATURED_APE)}`}
            body="One file from the archive."
            href={`/collection/${FEATURED_APE}`}
          />
          <HomeSignalLive />
        </div>
      </div>
    </section>
  );
}
