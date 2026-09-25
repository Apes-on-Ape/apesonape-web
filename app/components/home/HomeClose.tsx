import Link from 'next/link';

export default function HomeClose() {
  return (
    <section className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <h2 className="type-hero-home max-w-[12ch] text-[var(--ink)]">
          Still building.
          <br />
          Still loud.
          <br />
          Still together.
        </h2>
        <p className="type-section mt-8 text-[var(--ink)]">Turn the radio on.</p>
        <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
          <Link href="/music" className="aoa-home-cta aoa-home-cta-solid w-full min-[420px]:w-auto">
            AOA Radio
          </Link>
          <Link href="/collection" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">
            Explore the apes
          </Link>
          <Link href="/join" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">
            Join the community
          </Link>
        </div>
      </div>
    </section>
  );
}
